import { BigNumber, ethers, PayableOverrides } from 'ethers';
import { Erc20Bridger } from '@arbitrum/sdk';

import { arbSysABI } from '../abi/ArbSysABI';
import { BridgeNetworkConfig } from '../networks';
import { BridgerError } from '../errors';
import { ERROR_MESSAGES } from '../errorMessages';

/**
 * Withdraws ERC20 tokens
 *
 * @param {string} destinationTokenAddress - The address of the ERC20 token to withdraw.
 * @param {BigNumber} amount - The amount of tokens to withdraw.
 * @param {string} destination - The destination address on the Ethereum network.
 * @param {ethers.Signer} signer - The signer instance for signing transactions.
 * @param {PayableOverrides} [overrides] - Optional overrides for the transaction.
 * @returns {Promise<ethers.ContractTransaction>} - A promise that resolves to the transaction response.
 * @throws {BridgerError} - Throws an error if there is no provider.
 */
export const withdrawERC20 = async (
  destinationTokenAddress: string,
  amount: BigNumber,
  destination: string,
  signer: ethers.Signer,
  overrides?: PayableOverrides,
): Promise<ethers.ContractTransaction> => {
  const provider = signer.provider;
  if (!provider) {
    throw new BridgerError(ERROR_MESSAGES.NO_PROVIDER);
  }

  const erc20Bridger = await Erc20Bridger.fromProvider(provider);

  try {
    const withdrawTx = await erc20Bridger.withdraw({
      amount,
      destinationAddress: destination,
      erc20ParentAddress: destinationTokenAddress,
      childSigner: signer,
      overrides,
    });

    await withdrawTx.wait();
    return withdrawTx;
  } catch (error: any) {
    console.error('ERC20 Withdrawal transaction failed:', error);
    throw new BridgerError(`ERC20 withdrawal failed: ${error.message}`);
  }
};

/**
 * Withdraws native tokens
 *
 * @param {BigNumber} amount - The amount of native tokens to withdraw.
 * @param {string} destination - The destination address on the Ethereum network.
 * @param {ethers.Signer} signer - The signer instance for signing transactions.
 * @param {BridgeNetworkConfig} originNetwork - Configuration of the originating network.
 * @param {PayableOverrides} [overrides] - Optional overrides for the transaction.
 * @returns {Promise<ethers.ContractTransaction>} - A promise that resolves to the transaction response.
 * @throws {BridgerError} - Throws an error if arbSys is not configured for the origin network.
 */
export const withdrawNative = async (
  amount: BigNumber,
  destination: string,
  signer: ethers.Signer,
  originNetwork: BridgeNetworkConfig,
  overrides?: PayableOverrides,
): Promise<ethers.ContractTransaction> => {
  if (!originNetwork.arbSys) {
    throw new BridgerError(
      `Can't withdraw native without arbSys on network #${originNetwork.chainId}`,
    );
  }

  try {
    const arbSysContract = new ethers.Contract(originNetwork.arbSys, arbSysABI, signer);

    const txRequest = await arbSysContract.populateTransaction.withdrawEth(destination, {
      value: amount,
      ...overrides,
    });

    const txResponse = await signer.sendTransaction(txRequest);
    await txResponse.wait();

    return txResponse;
  } catch (error: any) {
    console.error('Native token withdrawal transaction failed:', error);
    throw new BridgerError(`Native withdrawal failed: ${error.message}`);
  }
};
