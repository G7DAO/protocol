import { SEVEN_DAYS_IN_SECONDS } from './constants';
import { ethers } from 'ethers';

export interface EthBridge {
  bridge: string;
  inbox: string;
  outbox: string;
  rollup: string;
  sequencerInbox: string;
}

export interface TokenBridge {
  parentCustomGateway: string;
  parentErc20Gateway: string;
  parentGatewayRouter: string;
  parentMultiCall: string;
  parentProxyAdmin: string;
  parentWeth: string;
  parentWethGateway: string;
  childCustomGateway: string;
  childErc20Gateway: string;
  childGatewayRouter: string;
  childMultiCall: string;
  childProxyAdmin: string;
  childWeth: string;
  childWethGateway: string;
}

export interface Teleporter {
  l1Teleporter: string;
  l2ForwarderFactory: string;
}

export interface BridgeNetworkConfig {
  chainId: number;
  confirmPeriodBlocks?: number;
  arbSys?: string;
  ethBridge?: EthBridge;
  tokenBridge?: TokenBridge;
  teleporter?: Teleporter;
  isCustom: boolean;
  isTestnet?: boolean;
  isArbitrum?: boolean;
  name: string;
  parentChainId?: number;
  explorerUrl?: string;
  blockTime?: number;
  retryableLifetimeSeconds?: number;
  nitroGenesisBlock?: number;
  nitroGenesisL1Block?: number;
  depositTimeout?: number;
  nativeCurrency?: {
    decimals: number;
    name: string;
    symbol: string;
  };
}

export const networks: { [chainId: number]: BridgeNetworkConfig } = {
  421614: {
    chainId: 421614,
    confirmPeriodBlocks: 20,
    ethBridge: {
      bridge: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
      inbox: '0xaAe29B0366299461418F5324a79Afc425BE5ae21',
      outbox: '0x65f07C7D521164a4d5DaC6eB8Fac8DA067A3B78F',
      rollup: '0xd80810638dbDF9081b72C1B33c65375e807281C8',
      sequencerInbox: '0x6c97864CE4bEf387dE0b3310A44230f7E3F1be0D',
    },
    isCustom: false,
    isTestnet: true,
    name: 'Arbitrum Rollup Sepolia Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'ETH',
      symbol: 'ETH',
    },
    parentChainId: 11155111,
    tokenBridge: {
      parentCustomGateway: '0xba2F7B6eAe1F9d174199C5E4867b563E0eaC40F3',
      parentErc20Gateway: '0x902b3E5f8F19571859F4AB1003B960a5dF693aFF',
      parentGatewayRouter: '0xcE18836b233C83325Cc8848CA4487e94C6288264',
      parentMultiCall: '0xded9AD2E65F3c4315745dD915Dbe0A4Df61b2320',
      parentProxyAdmin: '0xDBFC2FfB44A5D841aB42b0882711ed6e5A9244b0',
      parentWeth: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
      parentWethGateway: '0xA8aD8d7e13cbf556eE75CB0324c13535d8100e1E',
      childCustomGateway: '0x8Ca1e1AC0f260BC4dA7Dd60aCA6CA66208E642C5',
      childErc20Gateway: '0x6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502',
      childGatewayRouter: '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7',
      childMultiCall: '0xA115146782b7143fAdB3065D86eACB54c169d092',
      childProxyAdmin: '0x715D99480b77A8d9D603638e593a539E21345FdF',
      childWeth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
      childWethGateway: '0xCFB1f08A4852699a979909e22c30263ca249556D',
    },
    teleporter: {
      l1Teleporter: '0x9E86BbF020594D7FFe05bF32EEDE5b973579A968',
      l2ForwarderFactory: '0x88feBaFBb4E36A4E7E8874E4c9Fd73A9D59C2E7c',
    },
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
    blockTime: 12,
    isCustom: false,
    isArbitrum: false,
    nativeCurrency: {
      decimals: 18,
      name: 'ETH',
      symbol: 'ETH',
    },
  },
  13746: {
    chainId: 13746,
    confirmPeriodBlocks: 20,
    ethBridge: {
      bridge: '0xC7EEB897bA9bc3fA071C3871e7F4Cf1Ae7570f16',
      inbox: '0xE6470bb72291c39073AEd67a30ff93B69c1f47De',
      outbox: '0x64105c6C3D494469D5F21323F0E917563489d9f5',
      rollup: '0x6cf5bFffc54cDd13B4747e8DF2C72ce8A95043c0',
      sequencerInbox: '0xAe2caC32b0eF386Ab683459648eDFC78F7FF8F1e',
    },
    arbSys: '0x0000000000000000000000000000000000000064',
    explorerUrl: 'https://explorer-game7-testnet-0ilneybprf.t.conduit.xyz',
    isArbitrum: true,
    isCustom: true,
    name: 'conduit-orbit-deployer',
    nativeCurrency: {
      decimals: 18,
      name: 'Testnet Game7 Token',
      symbol: 'TG7T',
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
    },
    nitroGenesisBlock: 0,
    nitroGenesisL1Block: 0,
    depositTimeout: 900000,
  },
};

/**
 * Retrieves the network configuration based on the provided signer or provider.
 *
 * @param signerOrProvider - An instance of `ethers.Signer` or `ethers.providers.Provider`.
 * @returns A promise that resolves to a `Network` object corresponding to the provided signer or provider's network.
 * @throws An error if the network is not supported or if there is an issue retrieving the network.
 */
export async function getNetworkBySignerOrProvider(
  signerOrProvider: ethers.Signer | ethers.providers.Provider,
): Promise<BridgeNetworkConfig> {
  try {
    const provider =
      signerOrProvider instanceof ethers.Signer ? signerOrProvider.provider : signerOrProvider;
    if (!provider) {
      throw new Error('Signer does not have an associated provider.');
    }

    const network = await provider.getNetwork();
    const networkDetails = networks[network.chainId];

    if (!networkDetails) {
      throw new Error(`Unsupported network with chain ID: ${network.chainId}`);
    }

    return networkDetails;
  } catch (error) {
    console.error('Failed to get network by signer or provider:', error);
    throw new Error('Failed to retrieve network information.');
  }
}
