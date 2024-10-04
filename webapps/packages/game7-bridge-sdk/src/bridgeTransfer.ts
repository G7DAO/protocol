import { BigNumber, ethers } from 'ethers';
import { networks } from './networks';
import { UnsupportedNetworkError } from './errors';
import { TransactionReceipt } from '@ethersproject/abstract-provider/src.ts';

import { Provider } from '@ethersproject/abstract-provider';
import { getBlockETA, getBlockTimeDifference } from './utils/web3Utils';
import {
  ChildToParentMessageStatus,
  ChildToParentMessageWriter,
  ChildTransactionReceipt, ParentContractCallTransactionReceipt,
  ParentTransactionReceipt,
} from '@arbitrum/sdk';
import { L2GatewayRouterABI } from './abi/L2GatewayRouterABI';
import { arbSysABI } from './abi/ArbSysABI';
import { ERC20_ABI } from './abi/ERC20_ABI';

export type SignerOrProviderOrRpc = ethers.Signer | ethers.providers.Provider | string;

type BridgeReceiptDescription = 'initiating';
export interface BridgeReceipt {
  description: string;
  receipt: TransactionReceipt;
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

export interface CreateBridgeTransferParams {
  txHash: string;
  originSignerOrProviderOrRpc: SignerOrProviderOrRpc;
  destinationSignerOrProviderOrRpc: SignerOrProviderOrRpc;
}

export interface BridgeTransferStatus {
  status: ChildToParentMessageStatus;
  ETA: number | undefined;
}

export class BridgeTransfer {
  public readonly originNetworkChainId: number;
  public readonly destinationNetworkChainId: number;
  public readonly txHash: string;
  public readonly isDeposit: boolean;
  public readonly receipts: BridgeReceipt[] = [];
  public readonly isCompleted: boolean = false;
  public readonly tokenSymbol: string = '';
  public readonly originName: string;
  public readonly destinationName: string;
  public readonly value: BigNumber = BigNumber.from(0);
  public readonly explorerLink: string;
  private childTransactionReceipt: ChildTransactionReceipt | undefined;
  private readonly originProvider: Provider;
  private readonly destinationProvider: Provider;

  /**
   * Creates an instance of the `BridgeTransfer` class.
   *
   * @param originNetworkChainId - The chain ID of the network where the transaction originates.
   * @param destinationNetworkChainId - The chain ID of the network where the transaction is heading.
   * @param txHash - The transaction hash of the bridge transaction.
   * @param originSignerOrProviderOrRpc
   * @param destinationSignerOrProviderOrRpc
   */
  constructor({
                txHash,
                destinationNetworkChainId,
                originNetworkChainId,
                originSignerOrProviderOrRpc,
                destinationSignerOrProviderOrRpc,
              }: {
    txHash: string;
    destinationNetworkChainId: number;
    originNetworkChainId: number;
    originSignerOrProviderOrRpc?: SignerOrProviderOrRpc;
    destinationSignerOrProviderOrRpc?: SignerOrProviderOrRpc;
  }) {
    this.originNetworkChainId = originNetworkChainId;
    this.destinationNetworkChainId = destinationNetworkChainId;
    const originNetwork = networks[originNetworkChainId];
    const destinationNetwork = networks[destinationNetworkChainId];
    const originProvider = getProvider(originSignerOrProviderOrRpc ?? originNetwork.rpcs[0]);
    const destinationProvider = getProvider(destinationSignerOrProviderOrRpc ?? destinationNetwork.rpcs[0]);
    if (!originNetwork) {
      throw new UnsupportedNetworkError(originNetworkChainId);
    }
    if (!destinationNetwork) {
      throw new UnsupportedNetworkError(destinationNetworkChainId);
    }
    this.originName = originNetwork.name;
    this.destinationName = destinationNetwork.name;
    this.isDeposit = originNetwork.chainId === destinationNetwork.parentChainId;
    this.originProvider = originProvider;
    this.destinationProvider = destinationProvider;
    this.txHash = txHash;
    this.explorerLink = `${originNetwork.explorerUrl}/tx/${txHash}`
  }

  public async getStatus(): Promise<BridgeTransferStatus> {
    const originReceipt = await this.originProvider.getTransactionReceipt(this.txHash);
    const childTransactionReceipt = new ChildTransactionReceipt(originReceipt);

    const messages: any = await childTransactionReceipt.getChildToParentMessages(this.destinationProvider);
    const msg: any = messages[0];
    const status: ChildToParentMessageStatus = await msg.status(this.originProvider);
    const firstExecutableBlock = await msg.getFirstExecutableBlock(this.originProvider);

    const ETA = await getBlockETA(firstExecutableBlock, this.destinationProvider);
    return {
      ETA,
      status,
    };
  }

  public async getTransactionInputs() {
    const tx = await this.originProvider.getTransaction(this.txHash);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const isGasToken = tx.to === networks[this.originNetworkChainId]?.arbSys;
    if (!isGasToken && tx.to !== networks[this.originNetworkChainId]?.tokenBridge?.childGatewayRouter) {
      throw new Error("Can't decode inputs - unknown contract")
    }
    const contractInterface = new ethers.utils.Interface(isGasToken ? arbSysABI : L2GatewayRouterABI);

    const decodedInputs = contractInterface.parseTransaction({
      data: tx.data,
      value: tx.value,
    });
    const timestamp = tx.timestamp ?? 0;
    const txDateTime = new Date(timestamp * 1000);

    let tokenSymbol = isGasToken ? networks[this.destinationNetworkChainId]?.nativeCurrency?.symbol : undefined;
    if (!tokenSymbol) {
      const tokenContract = new ethers.Contract(decodedInputs.args._l1Token, ERC20_ABI, this.destinationProvider);
      tokenSymbol = await tokenContract.symbol();
    }
    const amount = isGasToken ? decodedInputs.value : decodedInputs.args._amount;

    return {
      txDateTime,
      to: isGasToken ? decodedInputs.args.destination : decodedInputs.args._to,
      amount,
      tokenAddress: isGasToken ? ethers.constants.AddressZero : decodedInputs.args._l1Token,
      tokenSymbol,
      amountFormatted: ethers.utils.formatEther(amount)
    }
  }

  public async execute(signer: ethers.Signer) {
    if (!this.childTransactionReceipt) {
      const originReceipt = await this.originProvider.getTransactionReceipt(this.txHash);
      this.childTransactionReceipt = new ChildTransactionReceipt(originReceipt);
    }
    const messages: ChildToParentMessageWriter[] =
      (await this.childTransactionReceipt.getChildToParentMessages(signer)) as ChildToParentMessageWriter[];
    const message = messages[0];
    const res = await message.execute(this.originProvider);
    return await res.wait();
  }


  public async getDepositStatus() {
    console.log(this.txHash)
    let receipt
    try {
      receipt = await this.originProvider.getTransactionReceipt(this.txHash)
    } catch (e) {
      console.log(e)
    }

    if (!receipt) {
      return
    }
    console.log('!!receipt')
    const parentTransactionReceipt = new ParentTransactionReceipt(receipt)
    const parentContractCallReceipt = new ParentContractCallTransactionReceipt(parentTransactionReceipt)

    let childResult
    try {
      childResult = await parentContractCallReceipt.waitForChildTransactionReceipt(this.destinationProvider, 3, 1000)
    } catch (e) {
      console.log(e)
    }
    console.log("!!childResult")
    if (!childResult) {
      return
    }
    const retryableCreationReceipt = await childResult.message.getRetryableCreationReceipt()
    let highNetworkTimestamp
    if (retryableCreationReceipt) {
      const block = await this.destinationProvider.getBlock(retryableCreationReceipt.blockNumber)
      highNetworkTimestamp = block.timestamp
    }
    return {
      childResult, retryableCreationReceipt
    }
  }

}
