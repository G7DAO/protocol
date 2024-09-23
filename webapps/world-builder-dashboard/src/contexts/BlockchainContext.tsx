// BlockchainContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { DEFAULT_HIGH_NETWORK, DEFAULT_LOW_NETWORK, L1_NETWORK, L2_NETWORK, L3_NETWORK } from '../../constants'
import { ethers } from 'ethers'

interface BlockchainContextType {
  walletProvider?: ethers.providers.Web3Provider
  connectedAccount?: string
  connectWallet: () => Promise<void>
  switchChain: (chain: NetworkInterface) => Promise<void>
  disconnectWallet: () => void
  tokenAddress: string
  selectedLowNetwork: NetworkInterface
  setSelectedLowNetwork: (network: NetworkInterface) => void
  selectedHighNetwork: NetworkInterface
  setSelectedHighNetwork: (network: NetworkInterface) => void
  isMetaMask: boolean
  getProvider: (network: NetworkInterface) => Promise<ethers.providers.Web3Provider>
  setChainId: (chainId: number) => void
  accounts: string[]
  setAccounts: (accounts: string[]) => void
  chainId: number | undefined
  isConnecting: boolean
}

export interface NetworkInterface {
  chainId: number
  name: string
  displayName?: string
  rpcs: Array<string>
  ABIScan?: { name: string; url: string }
  nativeCurrency?: {
    decimals: number
    name: string
    symbol: string
  }
  blockExplorerUrls?: string[]
  g7TokenAddress: string
  l2Router?: string
  l1GatewayRouter?: string
  routerSpender?: string
  retryableCreationTimeout?: number //seconds
  challengePeriod?: number //seconds
  staker?: string
  inbox?: string
}

export interface HighNetworkInterface extends NetworkInterface {
  inbox: string
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined)

interface BlockchainProviderProps {
  children: ReactNode
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  const [walletProvider, setWalletProvider] = useState<ethers.providers.Web3Provider>()
  const [selectedLowNetwork, _setSelectedLowNetwork] = useState<NetworkInterface>(DEFAULT_LOW_NETWORK)
  const [selectedHighNetwork, _setSelectedHighNetwork] = useState<NetworkInterface>(DEFAULT_HIGH_NETWORK)
  const [isMetaMask, setIsMetaMask] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [connectedAccount, setConnectedAccount] = useState<string>()
  const [accounts, setAccounts] = useState<string[]>([''])
  const tokenAddress = '0x5f88d811246222F6CB54266C42cc1310510b9feA'

  const setSelectedLowNetwork = (network: NetworkInterface) => {
    if (network === L1_NETWORK) {
      _setSelectedHighNetwork(L2_NETWORK)
    } else {
      _setSelectedHighNetwork(L3_NETWORK)
    }
    _setSelectedLowNetwork(network)
  }

  const setSelectedHighNetwork = (network: NetworkInterface) => {
    if (network === L2_NETWORK) {
      _setSelectedLowNetwork(L1_NETWORK)
    } else {
      _setSelectedLowNetwork(L2_NETWORK)
    }
    _setSelectedHighNetwork(network)
  }

  useEffect(() => {
    const ethereum = window.ethereum
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum)
      setWalletProvider(provider)
    }
    if (ethereum && ethereum.on) {
      ethereum.on('accountsChanged', handleAccountsChanged)
      return () => {
        ethereum.removeListener && ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [window.ethereum])

  const fetchChainId = async () => {
    const _chainId = (await walletProvider?.getNetwork())?.chainId
    setChainId(_chainId)
  }

  const handleChainChanged = (hexedChainId: string) => {
    const newChainId = parseInt(hexedChainId, 16) // Convert hex chainId to decimal
    setChainId(newChainId)
    console.log(`Network changed to chainId: ${newChainId}`)
  }

  useEffect(() => {
    fetchChainId()

    // if chain changed, set the new chain id
    if (window.ethereum?.on) {
      window.ethereum.on('chainChanged', handleChainChanged)
    }
  }, [walletProvider])

  const handleAccountsChanged = async () => {
    const ethereum = window.ethereum
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum)
      // @ts-ignore
      setIsMetaMask(window.ethereum?.isMetaMask && !window.ethereum?.overrideIsMetaMask)
      const accounts = await provider.listAccounts()
      setAccounts(accounts)
      if (accounts.length > 0) {
        setConnectedAccount(accounts[0])
      } else {
        setConnectedAccount(undefined)
      }
    }
  }

  useEffect(() => {
    handleAccountsChanged()
  }, [walletProvider])

  const connectWallet = async () => {
    setIsConnecting(true)
    const ethereum = window.ethereum
    if (ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(ethereum)
        setWalletProvider(provider)
        await ethereum.request({ method: 'eth_requestAccounts' })
        await handleAccountsChanged()
      } catch (error) {
        console.error('Error connecting to wallet:', error)
      }
    }
    setIsConnecting(false)
  }

  const getProvider = async (network: NetworkInterface) => {
    if (!window.ethereum) {
      throw new Error("Wallet isn't installed")
    }
    if (!walletProvider) {
      await connectWallet()
    } else {
      const accounts = await walletProvider.listAccounts()
      if (accounts.length === 0) {
        await connectWallet()
      }
    }

    await switchChain(network)
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setWalletProvider(provider)
    return provider
  }

  const switchChain = async (chain: NetworkInterface) => {
    if (!walletProvider) {
      throw new Error('Wallet is not connected')
    }
    const ethereum = window.ethereum
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

  const disconnectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const ethereum = window.ethereum ?? null
      // @ts-ignore
      if (ethereum && provider.connection.url === 'metamask' && !window.ethereum?.overrideIsMetaMask) {
        // @ts-ignore
        await ethereum.request({
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {}
            }
          ]
        })
      }
    }
  }

  return (
    <BlockchainContext.Provider
      value={{
        walletProvider,
        connectedAccount,
        connectWallet,
        tokenAddress,
        switchChain,
        selectedLowNetwork,
        setSelectedLowNetwork,
        selectedHighNetwork,
        setSelectedHighNetwork,
        isMetaMask,
        setChainId,
        chainId,
        disconnectWallet,
        getProvider,
        isConnecting,
        accounts,
        setAccounts
      }}
    >
      {children}
    </BlockchainContext.Provider>
  )
}

// Hook to use the context
export const useBlockchainContext = () => {
  const context = useContext(BlockchainContext)
  if (context === undefined) {
    throw new Error('useBlockchainContext must be used within a BlockchainProvider')
  }
  return context
}
