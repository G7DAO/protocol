import { BigNumber, ethers, PayableOverrides } from 'ethers';
import { getArbitrumNetwork } from '@arbitrum/sdk';
import { BridgerError, UnsupportedNetworkError } from '../errors';
import { ERC20_INBOX_ABI } from '../abi/erc20_inbox_abi';
import { BridgeNetworkConfig } from '../networks';
import { L1GatewayRouterABI } from '../abi/L1GatewayRouterABI';

export const depositERC20 = async (
  amount: BigNumber,
  destinationNetworkChainId: number,
  destinationAddress: string,
  originTokenAddress: string,
  signer: ethers.Signer,
  childProvider: ethers.providers.Provider,
  overrides?: PayableOverrides,
): Promise<ethers.ContractTransaction> => {
  const destinationNetwork = getArbitrumNetwork(destinationNetworkChainId);
  if (!destinationNetwork) {
    throw new UnsupportedNetworkError(destinationNetworkChainId);
  }
  // const erc20Bridger = new Erc20Bridger(destinationNetwork);
  //
  // const params: Erc20DepositParams = {
  //   amount,
  //   erc20ParentAddress: originTokenAddress,
  //   childProvider,
  //   parentSigner: signer,
  //   // overrides,
  // };
  // console.log(params);
  // return erc20Bridger.deposit(params);

  const gatewayRouter = destinationNetwork.tokenBridge?.parentGatewayRouter;
  if (!gatewayRouter) {
    throw new BridgerError(
      `Can't deposit ERC20 without parentGatewayRouter on network #${destinationNetworkChainId}`,
    );
  }

  try {
    const maxGas = ethers.BigNumber.from('79117');
    const gasPriceBid = ethers.BigNumber.from('887220000');
    const data = '0x';
    const gatewayContract = new ethers.Contract(gatewayRouter, L1GatewayRouterABI, signer);
    const txRequest = await gatewayContract.populateTransaction.outboundTransfer(
      originTokenAddress,
      destinationAddress,
      amount,
      maxGas,
      gasPriceBid,
      data,
      { value: ethers.utils.parseEther('0') },
    );

    const txResponse = await signer.sendTransaction(txRequest);
    await txResponse.wait();
    console.log(txResponse);
    return txResponse;
  } catch (error: any) {
    console.error('ERC20 deposit transaction failed:', error);
    throw new BridgerError(`ERC20 deposit failed: ${error.message}`);
  }
};

export const depositNative = async (
  amount: BigNumber,
  destinationNetwork: BridgeNetworkConfig,
  signer: ethers.Signer,
  overrides?: PayableOverrides,
): Promise<ethers.ContractTransaction> => {
  // const destinationNetwork = getArbitrumNetwork(destinationNetworkChainId);

  const destinationAddress = destinationNetwork.ethBridge?.inbox;
  if (!destinationAddress) {
    throw new UnsupportedNetworkError(destinationNetwork.chainId);
  }
  const ERC20InboxContract = new ethers.Contract(destinationAddress, ERC20_INBOX_ABI, signer);
  // const gasEstimate = await estimateDepositERC20ToNativeGas(
  //   amount,
  //   account,
  //   lowNetwork,
  //   highNetwork,
  // );

  const txRequest = await ERC20InboxContract.populateTransaction.depositERC20(amount);

  const txResponse = await signer.sendTransaction(txRequest);

  // Wait for the transaction to be mined
  await txResponse.wait();
  return txResponse;
};
