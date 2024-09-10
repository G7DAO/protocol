import { z } from 'zod';
import { ethers } from 'ethers';

const ZodEthereumAddress = z.custom(
  (value: any) => {
    console.log('value', value);
    return ethers.isAddress(value)
  },
  {
    message: `Invalid ethereum address`,
  }
);

export const requestFaucetPayload = z.object({
  params: z.object({
    recipientAddress: ZodEthereumAddress,
  }),
});

