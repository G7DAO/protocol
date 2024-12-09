import { BigNumber, ethers, PayableOverrides } from 'ethers';
import {Erc20Bridger, EthBridger, getArbitrumNetwork, ParentToChildTransactionRequest} from '@arbitrum/sdk';
import { UnsupportedNetworkError } from '../errors';
import { ERC20_INBOX_ABI } from '../abi/erc20_inbox_abi';
import { BridgeNetworkConfig, networks } from '../networks';
import { Erc20DepositParams } from '@arbitrum/sdk/dist/lib/assetBridger/erc20Bridger';
import { L2GatewayRouterABI } from '../abi/L2GatewayRouterABI';
import { EthDepositParams } from '@arbitrum/sdk/dist/lib/assetBridger/ethBridger';
import { GasAndFeeEstimation } from '../bridger';
import { getDecodedInputs } from '../utils/web3Utils';
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
    const estimatedGas = await contract.estimateGas['outboundTransfer(address,address,uint256,bytes)'](
      _l1Token,
      _to,
      _amount,
      _data,
      {
        value: ethers.utils.parseEther('0'),
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

export const estimateOutboundTransfer = async (txHash: string, provider: ethers.providers.Provider) => {

  console.log({provider})

  const tx = await provider.getTransaction(txHash);

  if (!tx) {
    throw new Error('Transaction not found');
  }

  const decodedInputs = getDecodedInputs(tx, L2GatewayRouterABI);
  console.log({ decodedInputs});
  const [maxSubmissionCost, extraData] = ethers.utils.defaultAbiCoder.decode(
    ['uint256', 'bytes'], // The types we're decoding (uint256 and bytes)
    decodedInputs.args._data
  );
  const {_token, _to, _amount, _maxGas, _gasPriceBid, _data} = decodedInputs.args
  const contract = new ethers.Contract(tx.to ?? '', L2GatewayRouterABI, provider);

  const newData = contract.interface.encodeFunctionData( 'outboundTransfer(address,address,uint256,uint256,uint256,bytes)',
    [
      _token,
      _to,
      ethers.BigNumber.from(0),
      _maxGas,
      _gasPriceBid,
      _data,
    ])
  console.log(tx.data, newData)

  console.log(ethers.utils.formatEther(maxSubmissionCost), extraData, ethers.utils.formatEther(tx.value))
  console.log(tx.to, tx.from, _maxGas.toString(), _gasPriceBid.toString())
  const txRequest = {
    to: tx.to,
    from: tx.from,
    value: tx.value, // The amount of ETH being sent
    data: newData,   // The transaction data (e.g., for smart contract interactions)
    // nonce: tx.nonce, // Use the same nonce if you want to simulate the same transaction
  };
  console.log(txRequest, provider)
  const estimatedGas = await provider.estimateGas(txRequest);

  console.log(`Estimated Gas: ${estimatedGas.toString()}`);
  return estimatedGas;
}

export const estimateOutboundTransfer2 = async (txHash: string, provider: ethers.providers.Provider) => {

  const tx = await provider.getTransaction(txHash);

  if (!tx) {
    throw new Error('Transaction not found');
  }

  const decodedInputs = getDecodedInputs(tx, L2GatewayRouterABI);
  console.log({ decodedInputs});

  const [maxSubmissionCost, extraData] = ethers.utils.defaultAbiCoder.decode(
    ['uint256', 'bytes'], // The types we're decoding (uint256 and bytes)
    decodedInputs.args._data
  );
  const [maxSubmissionCost1, extraData1] = ethers.utils.defaultAbiCoder.decode(
    ['uint256', 'bytes'], // The types we're decoding (uint256 and bytes)
    '0x0000000000000000000000000000000000000000000000000013be304992d88000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000'
  );

  console.log(ethers.utils.formatEther(tx.value), ethers.utils.formatEther(maxSubmissionCost), ethers.utils.formatEther(maxSubmissionCost1))
  const {} = decodedInputs.args
  const _token = '0xE2ef69e4af84dbeFb0a75F8491F27a52bF047b01'
  const _to = '0xea9035a97722C1fDE906a17184f558794E4a9141'
  const _amount = ethers.BigNumber.from(0)
  const _maxGas = ethers.BigNumber.from(79105)
  const _gasPriceBid = ethers.BigNumber.from(600000000)
  const contract = new ethers.Contract(tx.to ?? '', L2GatewayRouterABI, provider);
  const _data = '0x0000000000000000000000000000000000000000000000000013be304992d88000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000'
  const newData = contract.interface.encodeFunctionData( 'outboundTransfer(address,address,uint256,uint256,uint256,bytes)',
    [
      _token,
      _to,
      _amount,
      _maxGas,
      _gasPriceBid,
      _data,
    ])
  console.log(tx.data, newData)

  console.log(ethers.utils.formatEther(maxSubmissionCost), extraData, ethers.utils.formatEther(tx.value))
  console.log(tx.to, tx.from, _maxGas.toString(), _gasPriceBid.toString())


  const txRequest = {
    to: '0xcE18836b233C83325Cc8848CA4487e94C6288264',
    from: '0xea9035a97722C1fDE906a17184f558794E4a9141',
    value: ethers.utils.parseEther('1'), // The amount of ETH being sent
    data: newData,   // The transaction data (e.g., for smart contract interactions)
    // nonce: tx.nonce, // Use the same nonce if you want to simulate the same transaction
  };
  console.log(txRequest, provider)
  const estimatedGas = await provider.estimateGas(txRequest);

  console.log(`Estimated Gas: ${estimatedGas.toString()}`);
  return estimatedGas;
}



export interface DepositGasEstimation {
  estimatedParentChainGas: BigNumber,
  estimatedChildChainGas: BigNumber,
  estimatedChildChainSubmissionCost: BigNumber,
  request: ParentToChildTransactionRequest,
}

export const getDepositGasEstimation = async (amount, parentProvider: ethers.providers.Provider, childProvider: ethers.providers.Provider, from: string, parentChainErc20Address: string): Promise<DepositGasEstimation> => {
  const erc20Bridger = await Erc20Bridger.fromProvider(childProvider)

  try {
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
    let estimatedParentChainGas
    try {
      estimatedParentChainGas = await parentProvider.estimateGas(txRequest)
    } catch (e) {
      console.error('Error estimating parentChainGas: ')
    }
    return {
      estimatedParentChainGas,
      estimatedChildChainGas: retryableData.gasLimit,
      estimatedChildChainSubmissionCost: retryableData.maxSubmissionCost,
      request,
    }
  } catch (e) {
    console.error('getDepositRequest error')
  }

}


export const estimateDepositErc20 = async (amount: ethers.BigNumber, provider: ethers.providers.Provider, contractAddress: string, from: string, token: string) => {

  const contract = new ethers.Contract(contractAddress, L2GatewayRouterABI, provider);
  const MAX_SUBMISSION_COST = ethers.BigNumber.from('5557139159570560')
  const MAX_GAS = ethers.BigNumber.from(79105)
  const GAS_PRICE_BID = ethers.BigNumber.from(600000000)
  const VALUE = ethers.utils.parseEther('0.0057')
  const _extraData = ethers.utils.defaultAbiCoder.encode(['uint256', 'bytes'], [MAX_SUBMISSION_COST, '0x'])

  const data = contract.interface.encodeFunctionData( 'outboundTransfer(address,address,uint256,uint256,uint256,bytes)',
    [
      token,
      from,
      amount,
      MAX_GAS,
      GAS_PRICE_BID,
      _extraData,
    ])
  const txRequest = {
    to: contractAddress,
    from: from,
    value: VALUE,
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




