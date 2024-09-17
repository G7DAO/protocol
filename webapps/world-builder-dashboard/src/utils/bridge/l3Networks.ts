interface ChainInfo {
  batchPoster: string
  staker: string
  chainOwner: string
  chainId: number
  chainName: string
  parentChainId: number
  nativeToken: string
  rpcs: string[]
  blockExplorerURls?: string
}

interface CoreContracts {
  rollup: string
  inbox: string
  outbox: string
  adminProxy: string
  sequencerInbox: string
  bridge: string
  utils: string
  validatorWalletCreator: string
  upgradeExecutor?: string
  upgradeExecutorL2?: string
  l3UpgradeExecutor?: string
}

interface L2L3ContractAddresses {
  customGateway: string
  multicall: string
  proxyAdmin: string
  router: string
  standardGateway: string
  weth: string
  wethGateway: string
}

interface TokenBridgeContracts {
  l2Contracts: L2L3ContractAddresses
  l3Contracts: L2L3ContractAddresses
}

export interface L3NetworkConfiguration {
  chainInfo: ChainInfo
  coreContracts: CoreContracts
  tokenBridgeContracts: TokenBridgeContracts
}

export const L3_NETWORKS = [
  {
    chainInfo: {
      batchPoster: '0x4733c8F43989256a87F415D6020Bdc8953cfb934',
      staker: '0x4CA9B1A37881D3Cbe9a064B67aC28C0e49BFBEA2',
      chainOwner: '0x67b948946480f88507512374cba903faaa0d4bb3',
      chainId: 1398587,
      chainName: 'G7 Testnet',
      parentChainId: 421614,
      nativeToken: '0x5f88d811246222F6CB54266C42cc1310510b9feA',
      rpcs: ['https://game7-testnet-custom.rpc.caldera.xyz/http'],
      blockExplorerURLs: ['https://game7-testnet-custom.explorer.caldera.xyz']
    },
    coreContracts: {
      rollup: '0x90A8dc739e9986FBc4BE080680e832ee5EFEcb75',
      inbox: '0xaACd8bE2d9ac11545a2F0817aEE35058c70b44e5',
      outbox: '0xDDfFefce2691353b84Cd60a7651a3c0F044a4ea1',
      adminProxy: '0xF80296627bc317A4A93801c9761B82A754882029',
      sequencerInbox: '0xaed977F5D695eae231575560d635ECAb07283647',
      bridge: '0x26Ea5f3EffEbb49BF3D27b756f3B99B0914a202f',
      utils: '0xDaE6924DAFBefb0eb7Ae2B398958920dE61173F2',
      validatorWalletCreator: '0x85Feb8fE05794c2384b848235942490a6610C64B',
      upgradeExecutor: '0xaf0B28462B18df0D7e3b2Ee64684d625f8C3Cb8C',
      upgradeExecutorL2: '0xee2439C4C47b84aA718a8f899AECf274Cd759eF6',
    },
    tokenBridgeContracts: {
      l2Contracts: {
        customGateway: '0xeA7f73a6fFA8d08CB8FCFE12e58CF4951CD9f818',
        multicall: '0x3AFeb1Ea760EED35D224C531D531C30eC6aE13e5',
        proxyAdmin: '0xF80296627bc317A4A93801c9761B82A754882029',
        router: '0x378f8B8727F4741b9404D6fF3A9D74cb662bF58D',
        standardGateway: '0xE763bC0e5978f264b3F3F5787D58Dc531649e641',
        weth: '0x0000000000000000000000000000000000000000',
        wethGateway: '0x0000000000000000000000000000000000000000'
      },
      l3Contracts: {
        customGateway: '0x54C38DBDb0318653E3D1dFf698C245eD35C3bB96',
        multicall: '0xD3e2587aDF118364EA931235BEAe4CeDFAa1d644',
        proxyAdmin: '0xB7D8c3Bba729E12F4CDd54c4C492cFA962cFcE6E',
        router: '0xc5966E3958E55bAD8A3D6E71753dCE2DFfcc7e15',
        standardGateway: '0x8E57DeB813cD10c5303e97ca2fdE5C33463CaFDC',
        weth: '0x0000000000000000000000000000000000000000',
        wethGateway: '0x0000000000000000000000000000000000000000'
      }
    }
  },
  {
    chainInfo: {
      minL2BaseFee: 10000000,
      networkFeeReceiver: '0x252431e84d5e22435a0c833c2220770c52f59633',
      infrastructureFeeCollector: '0x252431e84d5e22435a0c833c2220770c52f59633',
      batchPoster: '0x3e3779347f9346a736CA18cC7EfDF50Cca3242A4',
      staker: '0x4673A108FaF60f96016d11f801beA6a6F569f3F7',
      chainOwner: '0x64EEAE6be58c5b68F5928A18c9F565e012A8a240',
      chainName: 'G7 Testnet Conduit',
      chainId: 7007007,
      parentChainId: 421614,
      nativeToken: '0x4EdD6ddeAf8f259dba75AC8C5C89ee7564201170',
      rpcs: ['https://rpc-game7-arb-anytrust-wcj9hysn7y.t.conduit.xyz']
    },
    coreContracts: {
      rollup: '0x6394a010F7170Eb3a35430DDADE88ACE012c2173',
      inbox: '0xF03873d192Ee9d78d76B8678F4b400920E0Ef372',
      outbox: '0xd2F4098Ec9F2d1829761BAA3149995230aAd3B9b',
      adminProxy: '0x9a65E001b77c2a8411Fa6f2108A848bB24C8D480',
      sequencerInbox: '0x604e43fc633b83D1Ed2a1E68fb3ca4c9daB9f9bC',
      bridge: '0x50630f643aC9D2303911EB1a2d52B5352d057104',
      utils: '0xB11EB62DD2B352886A4530A9106fE427844D515f',
      validatorWalletCreator: '0xEb9885B6c0e117D339F47585cC06a2765AaE2E0b',
      l3UpgradeExecutor: '0x8c2960f889d71B2f3b77E521542bae5219CD9751'
    },
    tokenBridgeContracts: {
      l2Contracts: {
        customGateway: '0x2B58bBDcC80c1D7A6a81d88889f573377F19f9c3',
        multicall: '0xce1CAd780c529e66e3aa6D952a1ED9A6447791c1',
        proxyAdmin: '0x9a65E001b77c2a8411Fa6f2108A848bB24C8D480',
        router: '0x30b5eE064f899849d4B3606d2E4EAf432c92E845',
        standardGateway: '0x7F786F4C941769AaacA55263295b811d25a6E147',
        weth: '0x0000000000000000000000000000000000000000',
        wethGateway: '0x0000000000000000000000000000000000000000'
      },
      l3Contracts: {
        customGateway: '0xD7BB4371265C1e0878D97F05B7EaF9A9817a87c6',
        multicall: '0xB152BBC0B545c7952e74e910EfBE0a0a7Ac1fae2',
        proxyAdmin: '0x9A54f3Db82D5561aAD0cC25d8edc78f36288c49e',
        router: '0xdC5e06A672ce8c0D585A1130dB68622c7beb90EA',
        standardGateway: '0x4A94c0F31F9E673A9BaE3e2EE70bcE42dfc9F850',
        weth: '0x0000000000000000000000000000000000000000',
        wethGateway: '0x0000000000000000000000000000000000000000'
      }
    }
  },
  {
    chainInfo: {
    minL2BaseFee: 10000000,
      networkFeeReceiver: '0x252431e84d5e22435a0c833c2220770c52f59633',
      infrastructureFeeCollector: '0x252431e84d5e22435a0c833c2220770c52f59633',
      batchPoster: '0x8d77fDe7c1c812877631a6f7Efc9036dcB6481AC',
      staker: '0xc2d08c2CCFdB58e6d5b682bD51D617C049CeE9d4',
      chainOwner: '0x58f425D057C905D976601986831870B0044f9715',
      chainName: 'conduit-orbit-deployer',
      chainId: 13746,
      parentChainId: 421614,
      nativeToken: '0x10adBf84548F923577Be12146eAc104C899D1E75',
      rpcs: ['https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz']
    },
    coreContracts: {
      rollup: '0x6cf5bFffc54cDd13B4747e8DF2C72ce8A95043c0',
      inbox: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De',
      outbox: '0x64105c6C3D494469D5F21323F0E917563489d9f5',
      adminProxy: '0x8767Ea2Ce21ac4e624F8a36948BD5EA23A3288D9',
      sequencerInbox: '0xAe2caC32b0eF386Ab683459648eDFC78F7FF8F1e',
      bridge: '0xC7EEB897bA9bc3fA071C3871e7F4Cf1Ae7570f16',
      utils: '0xB11EB62DD2B352886A4530A9106fE427844D515f',
      validatorWalletCreator: '0xEb9885B6c0e117D339F47585cC06a2765AaE2E0b',
      l3UpgradeExecutor: '0x8d2821B57E7B3D860E250C0bdc7Cb924B17C72b2',
      staking: '0xa6B0461b7E54Fa342Be6320D4938295A81f82Cd3'
    },
    tokenBridgeContracts: {
      l2Contracts: {
        customGateway: '0x81aCB22000A2A81D26E7e1ed5a8f51930A31598E',
        multicall: '0xce1CAd780c529e66e3aa6D952a1ED9A6447791c1',
        proxyAdmin: '0x8767Ea2Ce21ac4e624F8a36948BD5EA23A3288D9',
        router: '0x73EeAEEC11473534a2249c851e4b245E61Da8732',
        standardGateway: '0x4A24f98D6fB62Ce8eA8f6C2D5AF9c8BF1c853fD7',
        weth: '0x0000000000000000000000000000000000000000',
        wethGateway: '0x0000000000000000000000000000000000000000'
      },
      l3Contracts: {
        customGateway: '0xe6c5Ab297E022A592a3fF26984cc6352C7cD0f92',
        multicall: '0x27c4a2f1B1685F0AD1ea2227F56606066Aa95Bd0',
        proxyAdmin: '0x07424574dbF6508D1c79755ab8f1ba3883cc38f3',
        router: '0xDA379C01a484fB9F0875730430a418eB8AAFdca2',
        standardGateway: '0x9b43912709756DcFd34A64D4362b579928fDcC26',
        weth: '0x0000000000000000000000000000000000000000',
        wethGateway: '0x0000000000000000000000000000000000000000'
      }
    }
  }
]
