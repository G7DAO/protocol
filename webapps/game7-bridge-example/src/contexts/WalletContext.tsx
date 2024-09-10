import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { NetworkInterface } from '../types'
import { ExternalProvider } from '@ethersproject/providers'

interface WalletContextType {
  account: string
  error: string
  connectWallet: () => Promise<void>
  isConnecting: boolean
  getSigner: (network?: NetworkInterface) => Promise<ethers.Signer>
  getProvider: (network?: NetworkInterface) => Promise<ethers.providers.Web3Provider>
  getRPCProvider: (network: NetworkInterface) => ethers.providers.JsonRpcProvider
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const [selectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(selectedAccount)
      } catch (err) {
        setError('Failed to connect wallet')
        console.error('Error connecting to wallet:', err)
      }
    } else {
      setError('MetaMask is not installed. Please install it to use this app.')
    }
  }

  const getRPCProvider = (network: NetworkInterface) => {
    return new ethers.providers.JsonRpcProvider(network.rpcs[0])
  }

  const getProvider = async (network?: NetworkInterface) => {
    if (!window.ethereum) {
      throw new Error("Wallet isn't installed")
    }
    const ethereum = window.ethereum as ExternalProvider
    const walletProvider = new ethers.providers.Web3Provider(ethereum)

    const accounts = await walletProvider.listAccounts()
    if (accounts.length === 0) {
      await connectWallet()
    }
    if (network) {
      await switchChain(network)
      return new ethers.providers.Web3Provider(ethereum)
    }
    return walletProvider
  }

  const getSigner = async (network?: NetworkInterface) => {
    const provider = await getProvider(network)
    return (await provider.getSigner()) as ethers.Signer
  }

  const switchChain = async (chain: NetworkInterface) => {
    const ethereum = window.ethereum as ExternalProvider
    if (!ethereum) {
      throw new Error("Wallet isn't installed")
    }
    setIsConnecting(true)

    try {
      const provider = new ethers.providers.Web3Provider(ethereum, 'any')
      const currentChain = await provider.getNetwork()
      if (currentChain.chainId !== chain.chainId) {
        const hexChainId = ethers.utils.hexStripZeros(ethers.utils.hexlify(chain.chainId))
        try {
          await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] })
        } catch (error: any) {
          if (error.code === 4902 || error.code === -32603) {
            //unfortunately, 'chain not found' error not always has code 4902, sometimes it's -32603 (blanket error). But we can assume that error trying to switch to a chain is caused by absence of the chain
            try {
              // Chain most probably not found, attempt to add it
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: hexChainId,
                    chainName: chain.displayName || chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: chain.rpcs,
                    blockExplorerUrls: chain.blockExplorerUrls
                  }
                ]
              })
            } catch (addError) {
              console.error('Failed to add the Ethereum chain:', addError)
              throw addError
            }
          } else {
            console.error('Failed to switch the Ethereum chain:', error)
            throw error
          }
        }
      }
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle account or network changes
  useEffect(() => {
    connectWallet()
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || '')
      })
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{ account, error, connectWallet, isConnecting, getProvider, getRPCProvider, getSigner }}
    >
      {children}
    </WalletContext.Provider>
  )
}
