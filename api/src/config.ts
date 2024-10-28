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

export const tableNameGame7 = 'game7_testnet_labels'; // Game7 table name
export const tableNameEthereum = 'sepolia_labels'; // Ethereum table name
export const tableNameArbitrum = 'arbitrum_sepolia_labels'; // Arbitrum table name
export const addressHex = 'e6470bb72291c39073aed67a30ff93b69c1f47de'; // Arbitrum Deposit contract address
export const addressL1ERC20Gateway = '902b3e5f8f19571859f4ab1003b960a5df693aff' // Ethereum L1ERC20Gateway address
export const addressL2ERC20Gateway = '6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502' // Ethereum L2ERC20Gateway address
export const addressOutBox = '64105c6C3D494469D5F21323F0E917563489d9f5' // Arbitrum outbox address
export const addressArbOSL2 = '0000000000000000000000000000000000000064' // Arbitrum ArbOS L2 address