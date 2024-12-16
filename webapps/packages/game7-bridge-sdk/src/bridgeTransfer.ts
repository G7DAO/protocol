import { BigNumber, ethers, Transaction } from 'ethers';
import { BridgeNetworkConfig, networks } from './networks';
import { UnsupportedNetworkError } from './errors';
import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider/src.ts';

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
import {CctpBridgeTransfer} from "./cctpBridgeTransfer";
import {isCctp} from "./utils/cctp";

export type SignerOrProviderOrRpc = ethers.Signer | ethers.providers.Provider | string;

export interface BridgeReceipt {
  description: string;
  receipt: TransactionReceipt;
}

export interface BridgeTransferParams {
  txHash: string;
  destinationNetworkChainId: number;
  originNetworkChainId: number;
  originSignerOrProviderOrRpc?: SignerOrProviderOrRpc;
  destinationSignerOrProviderOrRpc?: SignerOrProviderOrRpc;
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
  DEPOSIT_CCTP,
  WITHDRAW_CCTP
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
  DEPOSIT_GAS_DEPOSITED,
  CCTP_PENDING,
  CCTP_COMPLETE,
  CCTP_REDEEMED
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
  protected childTransactionReceipt: ChildTransactionReceipt | undefined;
  protected readonly originProvider: Provider;
  protected readonly destinationProvider: Provider;
  protected readonly destinationNetwork: BridgeNetworkConfig;

  /**
   * Constructs a new instance of the BridgeTransfer class.
   *
   * @param {Object} params - The parameters for the constructor.
   * @param {string} params.txHash - The transaction hash for the bridge transfer.
   * @param {number} params.destinationNetworkChainId - The chain ID of the destination network.
   * @param {number} params.originNetworkChainId - The chain ID of the origin network.
   * @param {SignerOrProviderOrRpc} [params.originSignerOrProviderOrRpc] - Optional signer, provider, or RPC string for the origin network.
   * @param {SignerOrProviderOrRpc} [params.destinationSignerOrProviderOrRpc] - Optional signer, provider, or RPC string for the destination network.
   *
   * @throws {UnsupportedNetworkError} If the origin or destination network is unsupported.
   *
   * @property {number} originNetworkChainId - The chain ID of the origin network.
   * @property {number} destinationNetworkChainId - The chain ID of the destination network.
   * @property {string} txHash - The transaction hash being tracked for the bridge transfer.
   * @property {boolean} isDeposit - Determines whether this transfer is a deposit (from parent to child chain).
   * @property {Provider} originProvider - The provider for the origin network.
   * @property {Provider} destinationProvider - The provider for the destination network.
   * @property {string} originName - The name of the origin network.
   * @property {string} destinationName - The name of the destination network.
   * @property {string} explorerLink - A URL to the transaction explorer for the origin network.
   * @property {BridgeNetworkConfig} destinationNetwork - Configuration object for the destination network.
   */

  constructor({
                txHash,
                destinationNetworkChainId,
                originNetworkChainId,
                originSignerOrProviderOrRpc,
                destinationSignerOrProviderOrRpc,
              }: BridgeTransferParams) {
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

  static getBridgeTransfer(params: BridgeTransferParams, isCCTP: boolean) {
    if (isCCTP) {
      return new CctpBridgeTransfer(params)
    }
    return new BridgeTransfer(params)
  }

  static async getBridgerTransferAndInfo(params: BridgeTransferParams) {
    const originNetwork = networks[params.originNetworkChainId];
    const originProvider = getProvider(params.originSignerOrProviderOrRpc ?? originNetwork.rpcs[0]);
    const tx =  await originProvider.getTransaction(params.txHash);
    const bridgeTransfer = isCctp(originNetwork.chainId, tx.to ?? '') ?
        new CctpBridgeTransfer(params) :
        new BridgeTransfer(params)
    const info = await bridgeTransfer.getInfo(tx)
    return {bridgeTransfer, info}
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


  public async getInfo(_tx?: TransactionResponse): Promise<BridgeTransferInfo>{
    let tx = _tx
    if (!tx) {
      tx = await this.originProvider.getTransaction(this.txHash);
    }
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
      throw new Error("Can't get Parent Transaction receipt");
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
      const childTxReceipt = (res as any).childTxReceipt
      const childTxHash = childTxReceipt?.transactionHash ?? res.message?.childTxHash //sometimes childTxHash is in the res, but childTxReceipt isn't
      const ETA = this.destinationNetwork.ethBridge?.depositTimeout ? this.destinationNetwork.ethBridge.depositTimeout * 1000 + Date.now() : undefined
      return {messageStatus: ethDepositMessageStatus, ETA, childTxReceipt, status, completionTxHash: childTxHash, completionExplorerLink: `${this.destinationNetwork.explorerUrl}/tx/${childTxHash}`}
    } else {
      const parentContractCallReceipt = new ParentContractCallTransactionReceipt(parentTransactionReceipt)
      const ETA = this.destinationNetwork.tokenBridge?.depositTimeout ? this.destinationNetwork.tokenBridge.depositTimeout * 1000 + Date.now() : undefined
      try {
        res = await parentContractCallReceipt.waitForChildTransactionReceipt(this.destinationProvider, 3, 1000)
      } catch (e: any) {
        console.error(e)
        if (e.message?.includes("Timed out waiting to retrieve retryable creation receipt")) {
          return {status: BridgeTransferStatus.DEPOSIT_ERC20_NOT_YET_CREATED, ETA}
        } else {
          throw new Error("Can't get Child Transaction receipt")
        }
      }
      const childTxReceipt = (res as any).childTxReceipt
      const childTxHash = childTxReceipt?.transactionHash
      const status = mapDepositERC20Status(res.status)
      return { messageStatus: res.status, ETA, childTxReceipt, status, completionTxHash: childTxHash, completionExplorerLink: `${this.destinationNetwork.explorerUrl}/tx/${childTxHash}`}
    }
  }

}
