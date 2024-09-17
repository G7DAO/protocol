import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv'
import { ChainId, NetworkExplorer, NetworkName, rpcUrls } from "./constants/network";
import "@nomicfoundation/hardhat-foundry";

dotenv.config()

const yes = ["true", "t", "yes", "y", "1"]
const GAS_PROFILER = yes.includes((process.env.GAS_PROFILER || "").toLowerCase());

const {
  ETHSCAN_API_KEY,
  ARB_SCAN_API_KEY,
} = process.env

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
    ],
    overrides: {
      "contracts/security/terminus/TerminusFacet.sol": {
        version: "0.8.24",
        settings:{
          optimizer: {
            enabled: true,
            runs: 200
          },
        },
      },
      "contracts/drops/dropper-V3/DropperV3Facet.sol" : {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled:true,
            runs:200
          },
        },
      },
    },
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
    },
    [NetworkName.ArbitrumOne]: {
      chainId: ChainId.ArbitrumOne,
      url: rpcUrls[ChainId.ArbitrumOne],
    },
    [NetworkName.Game7OrbitArbSepolia]: {
      url: rpcUrls[ChainId.Game7OrbitArbSepolia],
      chainId: ChainId.Game7OrbitArbSepolia,
    },
    [NetworkName.Game7OrbitBaseSepolia]: {
      url: rpcUrls[ChainId.Game7OrbitBaseSepolia],
      chainId: ChainId.Game7OrbitBaseSepolia,
    },
    [NetworkName.ArbitrumSepolia]: {
      url: rpcUrls[ChainId.ArbitrumSepolia],
      chainId: ChainId.ArbitrumSepolia,
    }
  },
};

export default config;
