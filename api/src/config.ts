import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { SwaggerOptions } from 'swagger-ui-express';
dotenv.config();

export const TOKEN_SENDER_ADDRESS =
  process.env.PROTOCOL_API_TOKEN_SENDER_ADDRESS ||
  '0x6601b6D6227985549dD571048B1ef180269ee9fC';
export const API_PORT = process.env.PROTOCOL_API_PORT || 4000;
export const API_HOST = process.env.PROTOCOL_API_HOST || 'localhost';
export const GAME7_TESTNET_RPC_URL =
  process.env.GAME7_TESTNET_RPC_URL ||
  'https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz';
export const KMS_CREDENTIALS = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAxxxxxxxxxxxxxxxx', // credentials for your IAM user with KMS access
  secretAccessKey:
    process.env.AWS_ACCESS_KEY_SECRET ||
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // credentials for your IAM user with KMS access
  region: process.env.AWS_REGION || 'us-east-1', // region of your KMS key
  keyId:
    process.env.PROTOCOL_API_AWS_KMS_KEY_ID ||
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // KMS key id (arn)
};
export const TOKEN_SENDER_AMOUNT =
  process.env.TOKEN_SENDER_AMOUNT || ethers.parseEther('1');

// CORS whitelist
const allowedOriginsStr = process.env.PROTOCOL_API_CORS_WHITELIST || '';
export const allowedOriginsArray = allowedOriginsStr.split(',').filter(Boolean);
export const allowedOrigins: { [key: string]: boolean } =
  allowedOriginsArray.reduce((acc, origin) => ({ ...acc, [origin]: true }), {});

const PROTOCOL_API_URL = process.env.PROTOCOL_API_BASE_URL || 'https://api.game7.build';

export const swaggerOptions: SwaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Protocol API',
      description: 'Protocol API Information',
      contact: {
        name: 'G7 Protocol',
      },
    },
    servers: [
      {
        url: PROTOCOL_API_URL,
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
  version: '1.0.0',
};


interface chainsRleationship {
  parentNetworkChainId: number;
  childNetworkChainId: number;
}

// map of chain name to map of address and tables names
// Map of chain name to a map of addresses and table names
export const bridgeConfig: {
  [chainName: string]: {
    addressERC20Inbox: string;
    addressEthereumOutbox: string;
    addressL2ERC20Gateway: string;
    addressL2GatewayRouter: string;
    addressL1GatewayRouter: string;
    addressL3GatewayRouter: string;
    addressArbitrumOutBox: string;
    addressArbOS: string;
    addressL1Inbox: string;
    L2OrbitGatewayRouter: string;
    AtbitrumCircleTokenMessenger: string;
    EthereumCircleTokenMessenger: string;
    l3TableName: string;
    l2TableName: string;
    l1TableName: string;
    l2rleationship: chainsRleationship;
    l3rleationship: chainsRleationship;
    l3Token: string;
    l2Token: string;
    l1Token: string;
    l1TokenName: string;
    l2TokenName: string;
    nativeToken: string;
    G7nativeTokenName: string;
  };
} = {
  "game7-testnet": {
    addressERC20Inbox: "e6470bb72291c39073aed67a30ff93b69c1f47de", // Arbitrum Deposit contract address
    addressEthereumOutbox: "65f07C7D521164a4d5DaC6eB8Fac8DA067A3B78F", // Ethereum L1ERC20Gateway address
    addressL2ERC20Gateway: "6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502", // Arbitrum L2ERC20Gateway address
    addressL2GatewayRouter: "9fDD1C4E4AA24EEc1d913FABea925594a20d43C7", // Arbitrum L2ERC20Gateway address
    addressL1GatewayRouter: "cE18836b233C83325Cc8848CA4487e94C6288264", // Ethereum deposit address
    addressL3GatewayRouter: "DA379C01a484fB9F0875730430a418eB8AAFdca2", // L3 Gateway Router address
    addressArbitrumOutBox: "64105c6C3D494469D5F21323F0E917563489d9f5", // Arbitrum outbox address ??
    addressArbOS: "0000000000000000000000000000000000000064", // Game7 ArbOS L2 address
    addressL1Inbox: "aAe29B0366299461418F5324a79Afc425BE5ae21", // Ethereum inbox address
    L2OrbitGatewayRouter: "73EeAEEC11473534a2249c851e4b245E61Da8732", // L1 Orbit Gateway Router address
    AtbitrumCircleTokenMessenger: "9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5", // Arbitrum Circle Token Messenger address
    EthereumCircleTokenMessenger: "9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5", // Ethereum Circle Token Messenger address
    l3TableName: "game7_testnet_labels",
    l2TableName: "arbitrum_sepolia_labels",
    l1TableName: "sepolia_labels",
    l3rleationship: { parentNetworkChainId: 421614, childNetworkChainId: 13746 },
    l2rleationship: { parentNetworkChainId: 11155111, childNetworkChainId: 421614 },
    l3Token: "0x10adBf84548F923577Be12146eAc104C899D1E75", // l3 native token
    l2Token: "0x10adBf84548F923577Be12146eAc104C899D1E75", // l2 l3 token
    l1Token: "0xe2ef69e4af84dbefb0a75f8491f27a52bf047b01", // l1 l3 token
    l1TokenName: "TG7T",
    l2TokenName: "TG7T",
    nativeToken: "0x0000000000000000000000000000000000000000", // native token
    G7nativeTokenName: "TG7T"
  },
  "game7": {
    addressERC20Inbox: "B1146A7eb098ECF46e8AAf695f4A960A963948d6", // Arbitrum Deposit contract address
    addressEthereumOutbox: "0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840", // Ethereum L1ERC20Gateway address
    addressL2ERC20Gateway: "096760F208390250649E3e8763348E783AEF5562", // Arbitrum L2ERC20Gateway address L1OrbitERC20Gateway 
    addressL2GatewayRouter: "5288c571Fd7aD117beA99bF60FE0846C4E84F933", // Arbitrum L2ERC20Gateway address L1OrbitGatewayRouter
    addressL1GatewayRouter: "72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef", // Ethereum deposit address
    addressL3GatewayRouter: "7Ca9c81d2AdD8bff46CEE9813d52bD84d94901DD", // L3 Gateway Router address
    addressArbitrumOutBox: "fbe537816d181888fAbE52338a5D921eE131E9Db", // Arbitrum outbox address ??
    addressArbOS: "0000000000000000000000000000000000000064", // Game7 ArbOS L2 address
    addressL1Inbox: "4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f", // Ethereum inbox address
    L2OrbitGatewayRouter: "73EeAEEC11473534a2249c851e4b245E61Da8732", // L1 Orbit Gateway Router Deposit
    AtbitrumCircleTokenMessenger: "19330d10D9Cc8751218eaf51E8885D058642E08A", // Arbitrum Circle Token Messenger address
    EthereumCircleTokenMessenger: "Bd3fa81B58Ba92a82136038B25aDec7066af3155", // Ethereum Circle Token Messenger address
    l3TableName: "game7_labels",
    l2TableName: "arbitrum_one_labels",
    l1TableName: "ethereum_labels",
    l3rleationship: { parentNetworkChainId: 42161, childNetworkChainId: 2187 },
    l2rleationship: { parentNetworkChainId: 1, childNetworkChainId: 42161 },
    l3Token: "F18e4466F26B4cA55bbAb890b314a54976E45B17", // l3 native token
    l2Token: "F18e4466F26B4cA55bbAb890b314a54976E45B17", // l2 l3 token
    l1Token: "0x12c88a3c30a7aabc1dd7f2c08a97145f5dccd830", // l1 l3 token
    l1TokenName: "G7",
    l2TokenName: "G7",
    nativeToken: "0x0000000000000000000000000000000000000000", // native token
    G7nativeTokenName: "G7"
  },
};


