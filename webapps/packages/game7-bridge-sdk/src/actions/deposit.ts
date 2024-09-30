import { BigNumber, ethers, PayableOverrides } from 'ethers';
import { Erc20Bridger, EthBridger, getArbitrumNetwork } from '@arbitrum/sdk';
import { UnsupportedNetworkError } from '../errors';
import { ERC20_INBOX_ABI } from '../abi/erc20_inbox_abi';
import { BridgeNetworkConfig } from '../networks';
import { Erc20DepositParams } from '@arbitrum/sdk/dist/lib/assetBridger/erc20Bridger';
import { L2GatewayRouterABI } from '../abi/L2GatewayRouterABI';
import { GasAndFeeEstimation } from '../types';
import { EthDepositParams } from '@arbitrum/sdk/dist/lib/assetBridger/ethBridger';

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

  const txResponse = await signer.sendTransaction(txRequest);

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
  };
  return await ethBridger.deposit(params);
};

export const estimateOutboundTransferGas = async (
  contractAddress: string,
  _l1Token: string,
  _to: string,
  _amount: ethers.BigNumberish,
  _data: string | ethers.BytesLike,
  provider: ethers.providers.Provider,
): Promise<GasAndFeeEstimation> => {
  const contract = new ethers.Contract(contractAddress, L2GatewayRouterABI, provider);
  try {
    const estimatedGas = await contract.estimateGas.outboundTransfer(
      _l1Token,
      _to,
      _amount,
      _data,
      {
        value: ethers.utils.parseEther('0.0005'),
        from: _to,
      },
    );
    const multiplier = ethers.BigNumber.from('1');
    const gasLimit = estimatedGas.mul(multiplier);
    const gasPrice = await provider.getGasPrice();
    const fee = gasLimit.mul(gasPrice);
    console.log({
      estimatedGas: ethers.utils.formatUnits(estimatedGas, 18),
      gasLimit: ethers.utils.formatUnits(gasLimit, 18),
      gasPrice: ethers.utils.formatUnits(gasPrice, 18),
      fee: ethers.utils.formatEther(fee),
    });
    return {
      estimatedGas,
      gasPrice,
      estimatedFee: fee,
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};
