// BlockchainContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import {
  DEFAULT_HIGH_MAINNET_NETWORK,
  DEFAULT_HIGH_NETWORK,
  DEFAULT_LOW_MAINNET_NETWORK,
  DEFAULT_LOW_NETWORK,
  L1_MAIN_NETWORK,
  L1_NETWORK,
  L2_MAIN_NETWORK,
  L2_NETWORK,
  L3_MAIN_NETWORK,
  L3_NETWORK
} from '../../constants'
import { ethers } from 'ethers'
import { getTokensForNetwork, Token } from '@/utils/tokens'

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
  selectedBridgeToken: Token
  setSelectedBridgeToken: (token: Token) => void
  selectedNativeToken: Token | null
  setSelectedNativeToken: (token: Token | null) => void
  isMetaMask: boolean
  getProvider: (network: NetworkInterface) => Promise<ethers.providers.Web3Provider>
  accounts: string[]
  setAccounts: (accounts: string[]) => void
  chainId: number | undefined
  isConnecting: boolean
  selectedNetworkType: NetworkType
  setSelectedNetworkType: (networkType: NetworkType) => void
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
  wrappedG7TokenAddress?: string
}

export type NetworkType = 'Testnet' | 'Mainnet' | undefined

export interface HighNetworkInterface extends NetworkInterface {
  inbox: string
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined)

interface BlockchainProviderProps {
  children: ReactNode
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  const [walletProvider, setWalletProvider] = useState<ethers.providers.Web3Provider>()
  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType>('Testnet')
  const [selectedLowNetwork, _setSelectedLowNetwork] = useState<NetworkInterface>(
    selectedNetworkType === 'Testnet' ? DEFAULT_LOW_NETWORK : DEFAULT_LOW_MAINNET_NETWORK
  )
  const [selectedHighNetwork, _setSelectedHighNetwork] = useState<NetworkInterface>(
    selectedNetworkType === 'Testnet' ? DEFAULT_HIGH_NETWORK : DEFAULT_HIGH_MAINNET_NETWORK
  )
  const [isMetaMask, setIsMetaMask] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [connectedAccount, setConnectedAccount] = useState<string>()
  const [accounts, setAccounts] = useState<string[]>([''])
  const [selectedBridgeToken, setSelectedBridgeToken] = useState<Token>(
    getTokensForNetwork(DEFAULT_LOW_NETWORK.chainId, connectedAccount)[0]
  )
  const [selectedNativeToken, setSelectedNativeToken] = useState<Token | null>(
    getTokensForNetwork(DEFAULT_LOW_NETWORK.chainId, connectedAccount).find(
      (token) => token.symbol === DEFAULT_LOW_NETWORK.nativeCurrency?.symbol
    ) ?? null
  )

  const tokenAddress = '0x5f88d811246222F6CB54266C42cc1310510b9feA'

  const setSelectedLowNetwork = (network: NetworkInterface) => {
    if (network === L1_NETWORK || network === L1_MAIN_NETWORK) {
      _setSelectedHighNetwork(selectedNetworkType === 'Testnet' ? L2_NETWORK : L2_MAIN_NETWORK)
    } else {
      _setSelectedHighNetwork(selectedNetworkType === 'Testnet' ? L3_NETWORK : L3_MAIN_NETWORK)
    }
    _setSelectedLowNetwork(network)
  }

  const setSelectedHighNetwork = (network: NetworkInterface) => {
    if (network === L2_NETWORK || network === L2_MAIN_NETWORK) {
      _setSelectedLowNetwork(selectedNetworkType === 'Testnet' ? L1_NETWORK : L1_MAIN_NETWORK)
    } else {
      _setSelectedLowNetwork(selectedNetworkType === 'Testnet' ? L2_NETWORK : L2_MAIN_NETWORK)
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

  useEffect(() => {
    fetchChainId()
    if (window.ethereum?.on) {
      window.ethereum.on('chainChanged', handleChainChanged)
    }
  }, [walletProvider])

  useEffect(() => {
    handleAccountsChanged()
  }, [walletProvider])

  // useEffect(() => {
  //   const _selectedNetworkType = localStorage.getItem('selectedNetworkType')
  //   if (_selectedNetworkType === 'Testnet' || _selectedNetworkType === 'Mainnet') {
  //     console.log('Selecting ', _selectedNetworkType)
  //     setSelectedNetworkType(_selectedNetworkType as NetworkType)
  //   } else {
  //     setSelectedNetworkType('Mainnet')
  //   }
  // }, [])

  useEffect(() => {
    if (selectedNetworkType) {
      localStorage.setItem('selectedNetworkType', selectedNetworkType)
    }
    if (selectedNetworkType === 'Testnet') {
      setSelectedLowNetwork(DEFAULT_LOW_NETWORK)
      setSelectedHighNetwork(DEFAULT_HIGH_NETWORK)
    } else {
      setSelectedLowNetwork(DEFAULT_LOW_MAINNET_NETWORK)
      setSelectedHighNetwork(DEFAULT_HIGH_MAINNET_NETWORK)
    }
  }, [selectedNetworkType])

  const fetchChainId = async () => {
    const _chainId = (await walletProvider?.getNetwork())?.chainId
    setChainId(_chainId)
  }

  const handleChainChanged = (hexedChainId: string) => {
    const newChainId = parseInt(hexedChainId, 16) // Convert hex chainId to decimal
    setChainId(newChainId)
  }

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
        chainId,
        disconnectWallet,
        getProvider,
        isConnecting,
        accounts,
        setAccounts,
        setSelectedBridgeToken,
        selectedBridgeToken,
        selectedNetworkType,
        setSelectedNetworkType,
        setSelectedNativeToken,
        selectedNativeToken
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
