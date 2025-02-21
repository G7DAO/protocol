import { BigNumber, ethers, PayableOverrides } from 'ethers';
import {
  Erc20Bridger,
  EthBridger,
  getArbitrumNetwork,
  ParentToChildTransactionRequest
} from '@arbitrum/sdk';
import { Erc20DepositParams } from '@arbitrum/sdk/dist/lib/assetBridger/erc20Bridger';
import { EthDepositParams } from '@arbitrum/sdk/dist/lib/assetBridger/ethBridger';

import { UnsupportedNetworkError } from '../errors';
import { BridgeNetworkConfig } from '../networks';

import { ERC20_INBOX_ABI } from '../abi/erc20_inbox_abi';
import { INBOX_ABI } from '../abi/inbox_abi';
import { ERC20_ABI } from '../abi/ERC20_ABI';

export const depositERC20 = async (
  amount: BigNumber,
  destinationNetworkChainId: number,
  originTokenAddress: string,
  signer: ethers.Signer,
  childProvider: ethers.providers.Provider,
  overrides?: PayableOverrides,
): Promise<ethers.ContractTransaction> => {
  const destinationNetwork = getArbitrumNetwork(destinationNetworkChainId);
  if (!destinationNetwork) {
    throw new UnsupportedNetworkError(destinationNetworkChainId);
  }
  const erc20Bridger = new Erc20Bridger(destinationNetwork);
  const params: Erc20DepositParams = {
    amount,
    erc20ParentAddress: originTokenAddress,
    childProvider,
    parentSigner: signer,
    overrides,
  };
  return await erc20Bridger.deposit(params);
};

export const depositNative = async (
  amount: BigNumber,
  destinationNetwork: BridgeNetworkConfig,
  signer: ethers.Signer,
  overrides?: PayableOverrides,
): Promise<ethers.ContractTransaction> => {
  const destinationAddress = destinationNetwork.ethBridge?.inbox;
  if (!destinationAddress) {
    throw new UnsupportedNetworkError(destinationNetwork.chainId);
  }
  const ERC20InboxContract = new ethers.Contract(destinationAddress, ERC20_INBOX_ABI, signer);

  const txRequest = await ERC20InboxContract.populateTransaction.depositERC20(amount);

  const txResponse = await signer.sendTransaction({
    ...txRequest,
    ...overrides
  });

  // Wait for the transaction to be mined
  await txResponse.wait();
  return txResponse;
};

export const depositETH = async (
  amount: BigNumber,
  destinationNetworkChainId: number,
  signer: ethers.Signer,
  overrides?: PayableOverrides,
): Promise<ethers.ContractTransaction> => {
  const destinationNetwork = getArbitrumNetwork(destinationNetworkChainId);
  if (!destinationNetwork) {
    throw new UnsupportedNetworkError(destinationNetworkChainId);
  }
  const ethBridger = new EthBridger(destinationNetwork);
  const params: EthDepositParams = {
    amount,
    parentSigner: signer,
    overrides,
  };
  return await ethBridger.deposit(params);
};


export interface DepositGasEstimation {
  estimatedParentChainGas: BigNumber,
  estimatedChildChainGas: BigNumber,
  estimatedChildChainSubmissionCost: BigNumber,
  request: ParentToChildTransactionRequest,
}

export const getDepositGasEstimation = async (amount: BigNumber, parentProvider: ethers.providers.Provider, childProvider: ethers.providers.Provider, from: string, parentChainErc20Address: string): Promise<DepositGasEstimation> => {
  const erc20Bridger = await Erc20Bridger.fromProvider(childProvider)

  const request = await erc20Bridger.getDepositRequest({
    amount,
    erc20ParentAddress: parentChainErc20Address,
    parentProvider: parentProvider,
    childProvider: childProvider,
    from,
    retryableGasOverrides: {
      // the gas limit may vary by about 20k due to SSTORE (zero vs nonzero)
      // the 30% gas limit increase should cover the difference
      gasLimit: { percentIncrease: BigNumber.from(30) }
    }
  })
  const { txRequest, retryableData } = request
  const estimatedParentChainGas = await parentProvider.estimateGas(txRequest)
  return {
    estimatedParentChainGas,
    estimatedChildChainGas: retryableData.gasLimit,
    estimatedChildChainSubmissionCost: retryableData.maxSubmissionCost,
    request,
  }

}


export const estimateDepositERC20ToEth = async (amount: ethers.BigNumber, provider: ethers.providers.Provider, contractAddress: string, from: string)=> {
  const ERC20InboxContract = new ethers.Contract(contractAddress, ERC20_INBOX_ABI, provider);
  const estimatedGas = await ERC20InboxContract.estimateGas.depositERC20(amount, { from });
  const gasPrice = await provider.getGasPrice();
  const fee = estimatedGas.mul(gasPrice);
  return {
    estimatedGas,
    gasPrice,
    estimatedFee: fee,
  }
}

export const estimateDepositEth = async (amount: ethers.BigNumber, provider: ethers.providers.Provider, contractAddress: string, from: string)=> {
  const inboxContract = new ethers.Contract(contractAddress, INBOX_ABI, provider);
  const data = inboxContract.interface.encodeFunctionData( 'depositEth()',
    [])
  const txRequest = {
    to: contractAddress,
    from,
    value: amount,
    data,
  };
  const estimatedGas = await provider.estimateGas(txRequest);
  const gasPrice = await provider.getGasPrice();
  const fee = estimatedGas.mul(gasPrice);
  return {
    estimatedGas,
    gasPrice,
    estimatedFee: fee,
  }

}


export const estimateApproval = async (amount: ethers.BigNumber, provider: ethers.providers.Provider, tokenAddress: string, spenderAddress: string, from: string) => {


  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  const txRequest = await tokenContract.populateTransaction.approve(
    spenderAddress,
    amount
  );

  try {
    const estimatedGas = await provider.estimateGas({
      ...txRequest,
      from,
    });

    const gasPrice = await provider.getGasPrice();
    const estimatedFee = estimatedGas.mul(gasPrice);

    return {
      estimatedGas,
      gasPrice,
      estimatedFee,
    };
  } catch (error: any) {
    console.error("Gas estimation failed:", error);
    throw new Error("Gas estimation failed: " + error.message);
  }
}




