import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-foundry';
import * as dotenv from 'dotenv';
import { ChainId, NetworkExplorer, NetworkName, rpcUrls } from './constants/network';
import './tasks/deploy-safe';

dotenv.config();

const yes = ['true', 't', 'yes', 'y', '1'];
const GAS_PROFILER = yes.includes((process.env.GAS_PROFILER || '').toLowerCase());

const { ETHSCAN_API_KEY, ARB_SCAN_API_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.5.10',
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
      {
        version: '0.8.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: GAS_PROFILER,
  },
  etherscan: {
    apiKey: {
      [NetworkName.Ethereum]: ETHSCAN_API_KEY || '',
      [NetworkName.ArbitrumOne]: ARB_SCAN_API_KEY || '',
      [NetworkName.ArbitrumSepolia]: ARB_SCAN_API_KEY || '',
    },
    customChains: [
      {
        network: NetworkName.Game7Testnet,
        chainId: ChainId.Game7Testnet,
        urls: {
          apiURL: `${NetworkExplorer.Game7Testnet}/api`,
          browserURL: NetworkExplorer.Game7Testnet,
        },
      },
    ],
  },
  networks: {
    [NetworkName.Ethereum]: {
      chainId: ChainId.Ethereum,
      url: rpcUrls[ChainId.Ethereum],
    },
    [NetworkName.ArbitrumOne]: {
      chainId: ChainId.ArbitrumOne,
      url: rpcUrls[ChainId.ArbitrumOne],
    },
    [NetworkName.Game7Testnet]: {
      url: rpcUrls[ChainId.Game7Testnet],
      chainId: ChainId.Game7Testnet,
    },
    [NetworkName.ArbitrumSepolia]: {
      url: rpcUrls[ChainId.ArbitrumSepolia],
      chainId: ChainId.ArbitrumSepolia,
    },
  },
};

export default config;
