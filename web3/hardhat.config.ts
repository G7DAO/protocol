import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv'
import { ChainId, NetworkExplorer, NetworkName, rpcUrls } from "./constants/network";

dotenv.config()

const {
  DEPLOYER_PRIVATE_KEY,
  ETHSCAN_API_KEY,
  ARB_SCAN_API_KEY,
} = process.env

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  etherscan: {
    apiKey: {
      [NetworkName.Ethereum]: ETHSCAN_API_KEY || '',
      [NetworkName.ArbitrumOne]: ARB_SCAN_API_KEY || '',
    },
    customChains: [
      {
          network: NetworkName.Game7OrbitArbSepolia,
          chainId: ChainId.Game7OrbitArbSepolia,
          urls: {
              apiURL: `${NetworkExplorer.Game7OrbitArbSepolia}/api`,
              browserURL: NetworkExplorer.Game7OrbitArbSepolia,
          },
      },
      {
          network: NetworkName.Game7OrbitBaseSepolia,
          chainId: ChainId.Game7OrbitBaseSepolia,
          urls: {
              apiURL: `${NetworkExplorer.Game7OrbitBaseSepolia}/api`,
              browserURL: NetworkExplorer.Game7OrbitBaseSepolia,
          },
      },
  ],
  },
  networks: {
    [NetworkName.Ethereum]: {
      chainId: ChainId.Ethereum,
      url: rpcUrls[ChainId.Ethereum],
      accounts: [DEPLOYER_PRIVATE_KEY || ''],
    },
    [NetworkName.ArbitrumOne]: {
      chainId: ChainId.ArbitrumOne,
      url: rpcUrls[ChainId.ArbitrumOne],
      accounts: [DEPLOYER_PRIVATE_KEY || ''],
    },
    [NetworkName.Game7OrbitArbSepolia]: {
      url: rpcUrls[ChainId.Game7OrbitArbSepolia],
      accounts: [DEPLOYER_PRIVATE_KEY || ''],
      chainId: ChainId.Game7OrbitArbSepolia,
    },
    [NetworkName.Game7OrbitBaseSepolia]: {
        url: rpcUrls[ChainId.Game7OrbitBaseSepolia],
        accounts: [DEPLOYER_PRIVATE_KEY || ''],
        chainId: ChainId.Game7OrbitBaseSepolia,
    },
  },
};

export default config;