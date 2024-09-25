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
        url: `${PROTOCOL_API_URL}/api`,
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
  version: '1.0.0',
};
