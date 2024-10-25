import { TokenAddressMap } from 'game7-bridge-sdk'
import { NetworkInterface, HighNetworkInterface } from '@/contexts/BlockchainContext'

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
  l1GatewayRouter: '0xcE18836b233C83325Cc8848CA4487e94C6288264',
  routerSpender: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De',
  retryableCreationTimeout: 60,
  challengePeriod: 60 * 60
}

export const L3_NETWORK: HighNetworkInterface = {
  chainId: 13746,
  name: 'conduit-orbit-deployer',
  displayName: 'G7 Sepolia',
  rpcs: ['https://testnet-rpc.game7.io'],
  blockExplorerUrls: ['https://testnet.game7.io'],
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

export const ALL_NETWORKS = [L1_NETWORK, L2_NETWORK, L3_NETWORK]

export const L3_NATIVE_TOKEN_SYMBOL = 'TG7T'
export const DEFAULT_LOW_NETWORK = L1_NETWORK
export const DEFAULT_HIGH_NETWORK = L2_NETWORK

export const LOW_NETWORKS = [L1_NETWORK, L2_NETWORK]
export const HIGH_NETWORKS = [L2_NETWORK, L3_NETWORK]

export const G7T_FAUCET_ADDRESS = '0xF587649a4C8E795E3bE44c489fc596FB06f800DE'
export const FAUCET_CHAIN = L2_NETWORK

export const ETH_USD_CONTRACT_ADDRESS = '0x694AA1769357215DE4FAC081bf1f309aDC325306'

export const FIVE_MINUTES = 1000 * 60 * 5

export const DEFAULT_STAKE_NATIVE_POOL_ID = '1'

export const MAX_ALLOWANCE_ACCOUNT = '0x9ed191DB1829371F116Deb9748c26B49467a592A'

export const TG7T: TokenAddressMap = {
  13746: '0x0000000000000000000000000000000000000000',
  421614: '0x10adbf84548f923577be12146eac104c899d1e75',
  11155111: '0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01'
}

export const ETH: TokenAddressMap = {
  421614: '0x0000000000000000000000000000000000000000',
  11155111: '0x0000000000000000000000000000000000000000'
}

// ETH, ARBITRUM, USDC, MANTLE, USDT,
export const ALL_TOKEN_MAPPINGS = [TG7T, ETH]

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60

export const networks = {
  13746: {
    chainId: 13746,
    confirmPeriodBlocks: 20,
    ethBridge: {
      bridge: '0xC7EEB897bA9bc3fA071C3871e7F4Cf1Ae7570f16',
      inbox: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De',
      outbox: '0x64105c6C3D494469D5F21323F0E917563489d9f5',
      rollup: '0x6cf5bFffc54cDd13B4747e8DF2C72ce8A95043c0',
      sequencerInbox: '0xAe2caC32b0eF386Ab683459648eDFC78F7FF8F1e'
    },
    arbSys: '0x0000000000000000000000000000000000000064',
    explorerUrl: 'https://testnet.game7.io',
    rpcs: ['https://testnet-rpc.game7.io'],
    isArbitrum: true,
    isCustom: true,
    name: 'Game7 Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Testnet Game7 Token',
      symbol: 'TG7T'
    },
    parentChainId: 421614,
    retryableLifetimeSeconds: SEVEN_DAYS_IN_SECONDS,
    tokenBridge: {
      parentCustomGateway: '0x81aCB22000A2A81D26E7e1ed5a8f51930A31598E',
      parentErc20Gateway: '0x4A24f98D6fB62Ce8eA8f6C2D5AF9c8BF1c853fD7',
      parentGatewayRouter: '0x73EeAEEC11473534a2249c851e4b245E61Da8732',
      parentMultiCall: '0xce1CAd780c529e66e3aa6D952a1ED9A6447791c1',
      parentProxyAdmin: '0x8767Ea2Ce21ac4e624F8a36948BD5EA23A3288D9',
      parentWeth: '0x0000000000000000000000000000000000000000',
      parentWethGateway: '0x0000000000000000000000000000000000000000',
      childCustomGateway: '0xe6c5Ab297E022A592a3fF26984cc6352C7cD0f92',
      childErc20Gateway: '0x9b43912709756DcFd34A64D4362b579928fDcC26',
      childGatewayRouter: '0xDA379C01a484fB9F0875730430a418eB8AAFdca2',
      childMultiCall: '0x27c4a2f1B1685F0AD1ea2227F56606066Aa95Bd0',
      childProxyAdmin: '0x07424574dbF6508D1c79755ab8f1ba3883cc38f3',
      childWeth: '0x0000000000000000000000000000000000000000',
      childWethGateway: '0x0000000000000000000000000000000000000000',
      depositTimeout: 2 * 60
    },
    nitroGenesisBlock: 0,
    nitroGenesisL1Block: 0,
    depositTimeout: 900000,
    isTestnet: true
  }
}
