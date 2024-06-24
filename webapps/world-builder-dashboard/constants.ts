import { ChainInterface } from './src/components/bridge/BlockchainContext'

export const L2_CHAIN: ChainInterface = {
  chainId: 421614,
  name: 'arbitrumSepolia',
  displayName: 'Arbitrum Sepolia',
  rpcs: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH'
  }
}

export const L3_NATIVE_TOKEN_SYMBOL = 'G7T'
