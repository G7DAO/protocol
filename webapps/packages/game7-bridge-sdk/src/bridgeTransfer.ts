import { ethers, BigNumber } from 'ethers';
import { networks } from './networks';
import { UnsupportedNetworkError } from './errors';
import { TransactionReceipt } from '@ethersproject/abstract-provider/src.ts';

import { Provider } from '@ethersproject/abstract-provider';
import { getBlockTimeDifference } from './utils/web3Utils';
import {
  ChildToParentMessageStatus,
  ChildToParentMessageWriter,
  ChildTransactionReceipt,
} from '@arbitrum/sdk';

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

  static async create(params: CreateBridgeTransferParams) {
    const originProvider = getProvider(params.originSignerOrProviderOrRpc);
    const destinationProvider = getProvider(params.destinationSignerOrProviderOrRpc);

    const originNetworkChainId = (await originProvider.getNetwork()).chainId;
    const destinationNetworkChainId = (await destinationProvider.getNetwork()).chainId;
    const originReceipt = await originProvider.getTransactionReceipt(params.txHash);

    const childReceipt = new ChildTransactionReceipt(originReceipt);

    const messages: any = await childReceipt.getChildToParentMessages(destinationProvider);
    const msg: any = messages[0];
    const status: ChildToParentMessageStatus = await msg.status(originProvider);

    console.log(msg, status, childReceipt);
    const msgTimestamp = new Date(msg.nitroReader.event.timestamp.toNumber() * 1000); // multiply by 1000 to convert seconds to milliseconds

    const initReceipt = await originProvider.getTransactionReceipt(params.txHash);
    const block = await originProvider.getBlock(initReceipt.blockNumber);
    const ETAblock = await msg.getFirstExecutableBlock(originProvider);
    if (ETAblock) {
      const interval = await getBlockTimeDifference(ETAblock, destinationProvider);
      console.log(interval);
    }
    console.log({ ETAblock });

    const initTimestamp = new Date(block.timestamp * 1000);
    console.log({ initTimestamp, msgTimestamp });
    const receipts: BridgeReceipt[] = [
      {
        description: 'initiation',
        receipt: initReceipt,
      },
    ];

    return new BridgeTransfer({
      originNetworkChainId,
      destinationNetworkChainId,
      receipts,
      childReceipt,
      childProvider: originProvider,
    });
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
}
