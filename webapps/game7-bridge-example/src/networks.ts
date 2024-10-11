import { NetworkInterface } from './types'
import {TokenAddressMap} from "game7-bridge-sdk";

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
  g7TokenAddress: '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01',
  routerSpender: '0x902b3e5f8f19571859f4ab1003b960a5df693aff',
  retryableCreationTimeout: 15 * 60
}

export const L2_NETWORK: NetworkInterface = {
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
  l1GatewayRouter: '0xcE18836b233C83325Cc8848CA4487e94C6288264',
  routerSpender: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De',
  retryableCreationTimeout: 60,
  challengePeriod: 60 * 60
}

export const L3_NETWORK: NetworkInterface = {
  chainId: 13746,
  name: 'conduit-orbit-deployer',
  displayName: 'Game7 Testnet',
  rpcs: ['https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz'],
  blockExplorerUrls: ['https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz'],
  nativeCurrency: {
    decimals: 18,
    name: 'Testnet Game7 Token',
    symbol: 'TG7T'
  },
  inbox: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De',
  g7TokenAddress: '0x0000000000000000000000000000000000000000',
  challengePeriod: 60 * 60,
  staker: '0xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
}

export const TG7T: TokenAddressMap = {
  13746: '0x0000000000000000000000000000000000000000',
  421614: '0x10adbf84548f923577be12146eac104c899d1e75',
  11155111: '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01'
}

export const ETH: TokenAddressMap = {
  421614: '0x0000000000000000000000000000000000000000',
  11155111: '0x0000000000000000000000000000000000000000'
}

export const F5: TokenAddressMap = {
  11155111: '0x8A0e3350fFAEb5DCcAca6045B3c07646FE9b46e7',
  421614: '0xE48e26A902565f15E9F3a63caf55d339c1b3d49E'
}

export const faucets = {
  '0x0000000000000000000000000000000000000000': {
    13746: 'https://build.game7.io/faucet',
    421614: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
    11155111: 'https://www.infura.io/faucet/sepolia',
  },
}

export const NETWORKS = [L1_NETWORK, L2_NETWORK, L3_NETWORK]

export const getRPC = (chainId: number) => {
  const rpc = NETWORKS.find((n) => n.chainId === chainId)?.rpcs[0]
  if (!rpc) {
    throw new Error(`No RPC provider for chainId ${chainId}`)
  }
  return rpc
}
