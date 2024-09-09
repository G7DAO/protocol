import * as dotenv from 'dotenv';
dotenv.config();

export const TOKEN_SENDER_ADDRESS = process.env.TOKEN_SENDER_ADDRESS || '';
export const API_PORT = process.env.API_PORT || 4000;
export const API_HOST = process.env.API_HOST || 'localhost';
export const GAME7_TESTNET_RPC_URL = process.env.GAME7_TESTNET_RPC_URL || 'https://rpc-game7-testnet-0ilneybprf.t.conduit.xyz';
