import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config();

export const TOKEN_SENDER_ADDRESS = process.env.TOKEN_SENDER_ADDRESS || '0x6601b6D6227985549dD571048B1ef180269ee9fC';
export const API_PORT = process.env.API_PORT || 4000;
export const API_HOST = process.env.API_HOST || 'localhost';
export const GAME7_TESTNET_RPC_URL = process.env.GAME7_TESTNET_RPC_URL || 'https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz';
export const KMS_CREDENTIALS = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAxxxxxxxxxxxxxxxx', // credentials for your IAM user with KMS access
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // credentials for your IAM user with KMS access
    region: process.env.AWS_REGION || 'us-east-1', // region of your KMS key
    keyId: process.env.AWS_KMS_KEY_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // KMS key id (arn)
  }
export const TOKEN_SENDER_AMOUNT = process.env.TOKEN_SENDER_AMOUNT || ethers.parseEther('1')