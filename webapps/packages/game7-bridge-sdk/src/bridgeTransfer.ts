import { BigNumber, ethers, Transaction } from 'ethers';
import { BridgeNetworkConfig, networks } from './networks';
import { UnsupportedNetworkError } from './errors';
import { TransactionReceipt } from '@ethersproject/abstract-provider/src.ts';

import { Provider } from '@ethersproject/abstract-provider';
import { getBlockETA, getDecodedInputs, getProvider } from './utils/web3Utils';
import {
  ChildToParentMessageStatus,
  ChildToParentMessageWriter,
  ChildTransactionReceipt, EthDepositMessageStatus,
  ParentContractCallTransactionReceipt,
  ParentEthDepositTransactionReceipt, ParentToChildMessageStatus,
  ParentTransactionReceipt,
} from '@arbitrum/sdk';
import { L2GatewayRouterABI } from './abi/L2GatewayRouterABI';
import { arbSysABI } from './abi/ArbSysABI';
import { ERC20_ABI } from './abi/ERC20_ABI';
import { ERC20_INBOX_ABI } from './abi/erc20_inbox_abi';
import { L1GatewayRouterABI } from './abi/L1GatewayRouterABI';
import { INBOX_ABI } from './abi/inbox_abi';

export type SignerOrProviderOrRpc = ethers.Signer | ethers.providers.Provider | string;

type BridgeReceiptDescription = 'initiating';
export interface BridgeReceipt {
  description: string;
  receipt: TransactionReceipt;
}

export interface BridgeTransferInfo {
  txHash: string,
  transferType: BridgeTransferType,
  timestamp?: number,
  to?: string,
  amount?: BigNumber,
  tokenDestinationAddress?: string,
  tokenOriginAddress?: string,
  tokenSymbol?: string,
  isDeposit: boolean,
  originNetworkChainId: number,
  destinationNetworkChainId: number,
  originName: string,
  destinationName: string,
  initTxExplorerUrl: string,
}

export enum BridgeTransferType {
  WITHDRAW_ERC20,
  WITHDRAW_GAS,
  DEPOSIT_ERC20,
  DEPOSIT_GAS,
  DEPOSIT_ERC20_TO_GAS,
}

export enum BridgeTransferStatus {
  WITHDRAW_UNCONFIRMED,
  WITHDRAW_CONFIRMED,
  WITHDRAW_EXECUTED,
  DEPOSIT_ERC20_NOT_YET_CREATED,
  DEPOSIT_ERC20_CREATION_FAILED,
  DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD,
  DEPOSIT_ERC20_REDEEMED,
  DEPOSIT_ERC20_EXPIRED,
  DEPOSIT_GAS_PENDING,
  DEPOSIT_GAS_DEPOSITED
}

function mapDepositERC20Status(status: ParentToChildMessageStatus): BridgeTransferStatus {
  switch (status) {
    case ParentToChildMessageStatus.NOT_YET_CREATED:
      return BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED;
    case ParentToChildMessageStatus.CREATION_FAILED:
      return BridgeTransferStatus.DEPOSIT_ERC20_CREATION_FAILED;
    case ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD:
      return BridgeTransferStatus.DEPOSIT_ERC20_FUNDS_DEPOSITED_ON_CHILD;
    case ParentToChildMessageStatus.REDEEMED:
      return BridgeTransferStatus.DEPOSIT_ERC20_REDEEMED;
    case ParentToChildMessageStatus.EXPIRED:
      return BridgeTransferStatus.DEPOSIT_ERC20_EXPIRED;
    default:
      throw new Error(`Unknown ParentToChildMessageStatus: ${status}`);
  }
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
  private readonly destinationNetwork: BridgeNetworkConfig;

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
    this.destinationNetwork = destinationNetwork;
  }

  public async getStatus() {
    if (!this.isDeposit) {
      const originReceipt = await this.originProvider.getTransactionReceipt(this.txHash);
      const childTransactionReceipt = new ChildTransactionReceipt(originReceipt);

      const messages: any = await childTransactionReceipt.getChildToParentMessages(this.destinationProvider);
      const msg: any = messages[0];
      const status: ChildToParentMessageStatus = await msg.status(this.originProvider);
      const firstExecutableBlock = await msg.getFirstExecutableBlock(this.originProvider);

      const ETA = await getBlockETA(firstExecutableBlock, this.destinationProvider);
      return {
        ETA,
        status: status === ChildToParentMessageStatus.EXECUTED ? BridgeTransferStatus.WITHDRAW_EXECUTED :
          status === ChildToParentMessageStatus.CONFIRMED ? BridgeTransferStatus.WITHDRAW_CONFIRMED :
            BridgeTransferStatus.WITHDRAW_UNCONFIRMED,
      };
    } else {
      return this.getDepositStatus()
    }
  }

  public getTransferTypeAndInputs(tx: Transaction) {
    if (this.isDeposit) {
      if (tx.to === networks[this.destinationNetworkChainId]?.ethBridge?.inbox) {
        try {
          const decodedInputs = getDecodedInputs(tx, INBOX_ABI);
          return {transferType: BridgeTransferType.DEPOSIT_GAS, decodedInputs};
        } catch (_) {
          try {
            const decodedInputs = getDecodedInputs(tx, ERC20_INBOX_ABI);
            return { transferType: BridgeTransferType.DEPOSIT_ERC20_TO_GAS, decodedInputs }
          } catch (_) {
            throw new Error (`Unable to decode inputs - unknown method of inbox contract ${tx.to}`);
          }
        }
      } else if (tx.to === networks[this.destinationNetworkChainId]?.tokenBridge?.parentGatewayRouter) {
        const decodedInputs = getDecodedInputs(tx, L1GatewayRouterABI);
        return {transferType: BridgeTransferType.DEPOSIT_ERC20, decodedInputs}
      }
    } else {
      if (tx.to === networks[this.originNetworkChainId]?.arbSys) {
        const decodedInputs = getDecodedInputs(tx, arbSysABI);
        return {transferType: BridgeTransferType.WITHDRAW_GAS, decodedInputs}
      } else if (tx.to === networks[this.originNetworkChainId]?.tokenBridge?.childGatewayRouter) {
        const decodedInputs = getDecodedInputs(tx, L2GatewayRouterABI);
        return {transferType: BridgeTransferType.WITHDRAW_ERC20, decodedInputs}
      }
    }
    throw new Error(`Unable to decode inputs - ${tx.to} is unknown contract`)
  }


  public async getInfo(): Promise<BridgeTransferInfo>{
    const tx = await this.originProvider.getTransaction(this.txHash);
    if (!tx) {
      throw new Error('Transaction not found');
    }
    const { transferType,  decodedInputs } = this.getTransferTypeAndInputs(tx);
    const {originNetworkChainId, destinationNetworkChainId, isDeposit, originName, destinationName, txHash} = this
    let info: BridgeTransferInfo = {
      txHash,
      transferType,
      originNetworkChainId,
      destinationNetworkChainId,
      isDeposit,
      originName,
      destinationName,
      initTxExplorerUrl: `${networks[this.originNetworkChainId].explorerUrl}/tx/${this.txHash}`
    }

    if (tx.blockNumber) {
      const block = await this.originProvider.getBlock(tx.blockNumber);
      info.timestamp = block?.timestamp;
    }
    info.transferType = transferType
    if (transferType === BridgeTransferType.WITHDRAW_GAS) {
      info.amount = decodedInputs.value;
      info.tokenSymbol = networks[this.originNetworkChainId]?.nativeCurrency?.symbol
      info.to = decodedInputs.args.destination
      info.tokenOriginAddress = ethers.constants.AddressZero
      return info
    } else
    if (transferType === BridgeTransferType.WITHDRAW_ERC20) {
      const tokenContract = new ethers.Contract(decodedInputs.args._l1Token, ERC20_ABI, this.destinationProvider);
      info.amount = decodedInputs.args._amount;
      info.tokenSymbol = await tokenContract.symbol();
      info.to = decodedInputs.args._to;
      info.tokenDestinationAddress = decodedInputs.args._l1Token;
      return info
    } else
    if (transferType === BridgeTransferType.DEPOSIT_ERC20) {
      const tokenContract = new ethers.Contract(decodedInputs.args._token, ERC20_ABI, this.originProvider);
      info.tokenSymbol = await tokenContract.symbol();
      info.amount = decodedInputs.args._amount;
      info.to = decodedInputs.args._to;
      info.tokenOriginAddress = decodedInputs.args._token;
      return info
    } else
    if (transferType === BridgeTransferType.DEPOSIT_GAS) {
      info.amount = decodedInputs.value
      info.tokenSymbol = networks[this.destinationNetworkChainId]?.nativeCurrency?.symbol
      info.to = tx.from
      info.tokenOriginAddress = ethers.constants.AddressZero
      info.tokenDestinationAddress = ethers.constants.AddressZero
      return info
    } else
    if (transferType === BridgeTransferType.DEPOSIT_ERC20_TO_GAS) {
      info.amount = decodedInputs.args.amount
      info.tokenSymbol = networks[this.destinationNetworkChainId]?.nativeCurrency?.symbol
      info.to = tx.from
      info.tokenDestinationAddress = ethers.constants.AddressZero
      return info
    }

    throw new Error('Unknown type of transfer')
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
    let receipt
    try {
      receipt = await this.originProvider.getTransactionReceipt(this.txHash)
    } catch (e) {
      console.log(e)
    }
    if (!receipt) {
      throw new Error("Can't get transaction receipt");
    }
    const parentTransactionReceipt = new ParentTransactionReceipt(receipt)
    let res
    const tx = await this.originProvider.getTransaction(this.txHash)
    const {transferType} = this.getTransferTypeAndInputs(tx)
    if (transferType === BridgeTransferType.DEPOSIT_ERC20_TO_GAS || transferType === BridgeTransferType.DEPOSIT_GAS) {
      const parentEthDepositReceipt = new ParentEthDepositTransactionReceipt(parentTransactionReceipt)
      res = await parentEthDepositReceipt.waitForChildTransactionReceipt(this.destinationProvider, 3 ,1000);
      const ethDepositMessageStatus = await res.message.status()
      const status = ethDepositMessageStatus === EthDepositMessageStatus.DEPOSITED ? BridgeTransferStatus.DEPOSIT_GAS_DEPOSITED : BridgeTransferStatus.DEPOSIT_GAS_PENDING
      const childTxHash = res.childTxReceipt?.transactionHash
      const ETA = this.destinationNetwork.ethBridge?.depositTimeout ? this.destinationNetwork.ethBridge.depositTimeout + Date.now() : undefined
      return {ETA, status, completionTxHash: childTxHash, completionExplorerLink: `${this.destinationNetwork.explorerUrl}/tx/${childTxHash}`}
    } else {
      // const msgs = await parentTransactionReceipt.getParentToChildMessages(this.destinationProvider)
      // const r = await msgs[0].status()
      console.log('1')
      const parentContractCallReceipt = new ParentContractCallTransactionReceipt(parentTransactionReceipt)
      const ETA = this.destinationNetwork.tokenBridge?.depositTimeout ? this.destinationNetwork.tokenBridge.depositTimeout + Date.now() : undefined
      try {
        res = await parentContractCallReceipt.waitForChildTransactionReceipt(this.destinationProvider, 3, 1000)
      } catch (e) {
        console.error(e)
        return {status: BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED, ETA}
      }
      const childTxHash = (res as any).childTxReceipt?.transactionHash
      const status = mapDepositERC20Status(res.status)
      return {ETA, status, completionTxHash: childTxHash, completionExplorerLink: `${this.destinationNetwork.explorerUrl}/tx/${childTxHash}`}
    }
    // const isEthDeposit = tx.to === networks[this.destinationNetworkChainId]?.ethBridge?.inbox;
    // if (!isEthDeposit && tx.to !== networks[this.destinationNetworkChainId]?.tokenBridge?.parentGatewayRouter) {
    //   throw new Error("Can't fetch status - unknown contract")
    // }
    // let res
    // let status
    // if (isEthDeposit) {
    //   const parentEthDepositReceipt = new ParentEthDepositTransactionReceipt(parentTransactionReceipt)
    //   res = await parentEthDepositReceipt.waitForChildTransactionReceipt(this.destinationProvider, 3 ,1000);
    //   console.log(res)
    // } else {
    //   const parentContractCallReceipt = new ParentContractCallTransactionReceipt(parentTransactionReceipt)
    //   res = await parentContractCallReceipt.waitForChildTransactionReceipt(this.destinationProvider, 3, 1000)
    //   console.log(res)
    // }

    // let childTxReceipt
    // let childTxHash
    // let childTx
    // if ('childTxReceipt' in res) {   //tsc doesn't understand that childTxReceipt is there (can be null though).
    //   childTxReceipt = (res as EthDepositMessageWaitForStatusResult).childTxReceipt;
    //   childTxHash = childTxReceipt?.transactionHash
    //   if (childTxHash) {
    //     childTx = await this.destinationProvider.getTransaction(childTxHash)
    //   }
    // }
    // return {
    //   status,
    //   isComplete: res.complete,
    //   completionHash: childTxHash,
    //   completionTimestamp: childTx?.timestamp,
    //   childTxReceipt,
    // }

    // let childResult
    // try {
    //   childResult = await childResultRetriever(this.destinationProvider, 3, 1000)
    // } catch (e) {
    //   console.log(e)
    // }
    // console.log(childResult)
    // if (!childResult) {
    //   return
    // }
    // const retryableCreationReceipt = await childResult.message.getRetryableCreationReceipt()
    // let highNetworkTimestamp
    // if (retryableCreationReceipt) {
    //   const block = await this.destinationProvider.getBlock(retryableCreationReceipt.blockNumber)
    //   highNetworkTimestamp = block.timestamp
    // }
    // return {
    //   childResult, retryableCreationReceipt
    // }
  }

}
