import { ethers, Transaction } from 'ethers';

export const getBlockTimeDifference = async (
  blockNumber: ethers.BigNumber,
  provider: ethers.providers.Provider,
): Promise<number> => {
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
): Promise<number> => {
  return Date.now() + await getBlockTimeDifference(blockNumber, provider);
};


export const getDecodedInputs = (tx: Transaction, ABI:  any) => { //ABI:  ReadonlyArray<Fragment | JsonFragment | string> gives TS building error
  const contractInterface = new ethers.utils.Interface(ABI);
  return contractInterface.parseTransaction({
    data: tx.data,
    value: tx.value,
  });
}

