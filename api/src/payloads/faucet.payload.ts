import { z } from 'zod';
import { ethers } from 'ethers';

const ZodEthereumAddress = z.custom(
  (value: any) => {
    const addressWithPrefix = value.startsWith('0x') ? value : `0x${value}`;
    return ethers.isAddress(addressWithPrefix);
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
