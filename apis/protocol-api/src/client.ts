import { createPublicClient, http, defineChain } from 'viem';

import {
  CHAIN_ID,
  CHAIN_NAME,
  RPC_URL,
  NATIVE_CURRENCY_NAME,
  NATIVE_CURRENCY_SYMBOL,
  NATIVE_CURRENCY_DECIMALS,
} from './config';

const client = createPublicClient({
  chain: defineChain({
    id: CHAIN_ID,
    name: CHAIN_NAME,
    nativeCurrency: {
      name: NATIVE_CURRENCY_NAME,
      symbol: NATIVE_CURRENCY_SYMBOL,
      decimals: NATIVE_CURRENCY_DECIMALS,
    },
    rpcUrls: {
      default: {
        http: [RPC_URL],
      },
    },
  }),
  transport: http(),
});

export default client;
