import {BigNumber, ethers, Transaction} from 'ethers';
import { SignerOrProviderOrRpc } from '../bridgeTransfer';

export const getBlockTimeDifference = async (
  blockNumber: ethers.BigNumber,
  provider: ethers.providers.Provider,
): Promise<number | undefined> => {
  if (!blockNumber) {
    return
  }
  const targetBlockNumber = blockNumber.toNumber();

  // Get the current block number
  const currentBlock = await provider.getBlockNumber();

  if (targetBlockNumber === currentBlock) {
    return 0;
  }

  // Get the current block timestamp and the block from 100 blocks ago for the average block time calculation
  const currentBlockData = await provider.getBlock(currentBlock);
  const pastBlockData = await provider.getBlock(currentBlock - 100);

  if (!currentBlockData || !pastBlockData) {
    throw new Error('Unable to fetch block data');
  }

  // Calculate the average block time
  const blockTimeInterval = (currentBlockData.timestamp - pastBlockData.timestamp) / 100;

  const blockDifference = targetBlockNumber - currentBlock;
  return blockDifference * blockTimeInterval * 1000;
};


export const getBlockETA = async (
  blockNumber: ethers.BigNumber,
  provider: ethers.providers.Provider,
): Promise<number | undefined> => {
  const blockTimeDifference = await getBlockTimeDifference(blockNumber, provider);
  return blockTimeDifference ? Date.now() + blockTimeDifference : undefined
};


export const getDecodedInputs = (tx: Transaction, ABI:  any) => { //ABI:  ReadonlyArray<Fragment | JsonFragment | string> gives TS building error
  const contractInterface = new ethers.utils.Interface(ABI);
  return contractInterface.parseTransaction({
    data: tx.data,
    value: tx.value,
  });
}

export const getProvider = (
  signerOrProviderOrRpc: SignerOrProviderOrRpc,
): ethers.providers.Provider => {
  if (typeof signerOrProviderOrRpc === 'string') {
    return new ethers.providers.JsonRpcProvider(signerOrProviderOrRpc);
  }
  const providerFromSigner = (signerOrProviderOrRpc as ethers.Signer).provider;
  if (providerFromSigner) {
    return providerFromSigner;
  }
  if (typeof signerOrProviderOrRpc.getGasPrice === 'function') {
    return signerOrProviderOrRpc as ethers.providers.Provider;
  }
  throw new Error(
    'Invalid input: expected a Signer with associated provider, Provider, or RPC URL string',
  );
};

export function percentIncrease(
    num: BigNumber,
    increase: BigNumber
): BigNumber {
  return num.add(num.mul(increase).div(100))
}

export function scaleFrom18DecimalsToNativeTokenDecimals( {amount, decimals}: {amount: BigNumber, decimals: number}) {
  // do nothing for 18 decimals
  if (decimals === 18) {
    return amount;
  }
  if (decimals < 18) {
    const scaledAmount = amount.div(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18 - decimals)));
    // round up if necessary
    if (scaledAmount
        .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(18 - decimals)))
        .lt(amount)) {
      return scaledAmount.add(ethers.BigNumber.from(1));
    }
    return scaledAmount;
  }
  // decimals > 18
  return amount.mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(decimals - 18)));
}

