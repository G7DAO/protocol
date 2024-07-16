import { NetworkInterface, HighNetworkInterface } from './src/components/bridge/BlockchainContext'

export const L2_NETWORK: HighNetworkInterface = {
  chainId: 421614,
  name: 'arbitrumSepolia',
  displayName: 'Arbitrum Sepolia',
  rpcs: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH'
  },
  inbox: '0xaAe29B0366299461418F5324a79Afc425BE5ae21'
}

export const L1_NETWORK: NetworkInterface = {
  chainId: 11155111,
  name: 'sepolia',
  displayName: 'Sepolia',
  rpcs: ['https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH'
  }
}

export const L3_NETWORK: HighNetworkInterface = {
  chainId: 13746,
  name: 'conduit-orbit-deployer',
  displayName: 'G7 Testnet',
  rpcs: ['https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz'],
  blockExplorerUrls: ['https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz'],
  nativeCurrency: {
    decimals: 18,
    name: 'G7T',
    symbol: 'G7T'
  },
  inbox: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De'
}

export const L3_NATIVE_TOKEN_SYMBOL = 'G7T'
export const DEFAULT_LOW_NETWORK = L1_NETWORK
export const DEFAULT_HIGH_NETWORK = L2_NETWORK
