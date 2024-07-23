import { NetworkInterface, HighNetworkInterface } from './src/components/bridge/BlockchainContext'
import { BigNumber } from 'ethers'

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
  },
  g7TokenAddress: '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01'
}

export const L2_NETWORK: HighNetworkInterface = {
  chainId: 421614,
  name: 'arbitrumSepolia',
  displayName: 'Arbitrum Sepolia',
  rpcs: ['https://sepolia-rollup.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH'
  },
  inbox: '0xaAe29B0366299461418F5324a79Afc425BE5ae21',
  g7TokenAddress: '0x10adbf84548f923577be12146eac104c899d1e75',
  l1GatewayRouter: '0xcE18836b233C83325Cc8848CA4487e94C6288264'
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
  inbox: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De',
  g7TokenAddress: '0x0000000000000000000000000000000000000000'
}

export const L3_NATIVE_TOKEN_SYMBOL = 'G7T'
export const DEFAULT_LOW_NETWORK = L1_NETWORK
export const DEFAULT_HIGH_NETWORK = L2_NETWORK

export const MaxUint256: BigNumber = /*#__PURE__*/ BigNumber.from(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
)
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const LOW_NETWORKS = [L1_NETWORK, L2_NETWORK]
export const HIGH_NETWORKS = [L2_NETWORK, L3_NETWORK]