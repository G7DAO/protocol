import {
    BridgeTransfer,
    BridgeTransferInfo,
    BridgeTransferStatus,
    BridgeTransferType,
    SignerOrProviderOrRpc
} from './bridgeTransfer';
import {ethers} from 'ethers';
import {networks} from "./networks";

import { defaultAbiCoder, id, keccak256 } from 'ethers/lib/utils'

import type { BigNumber } from '@ethersproject/bignumber'
import type { Log } from '@ethersproject/providers'
import type { Bytes } from 'ethers/lib/utils'
import {AttestationStatus, getAttestation} from "./utils/attestationService";
import {MessageTransmitterAbi} from "./abi/MessageTransmitterContract";
import {getDecodedInputs} from "./utils/web3Utils";
import {TokenMessengerAbi} from "./abi/TokenMessagerABI";
import {chainIdToUSDC, CommonAddress} from "./utils/cctp";

/**
 * CctpBridgeTransfer is a specialized implementation of the BridgeTransfer class for CCTP.
 */
export class CctpBridgeTransfer extends BridgeTransfer {
    private signature: string
    private messageBytes: ArrayLike<number>
    /**
     * Constructs a new instance of the CctpBridgeTransfer class.
     *
     * @param {Object} params - The parameters for the constructor.
     * @param {string} params.txHash - The transaction hash for the bridge transfer.
     * @param {number} params.destinationNetworkChainId - The chain ID of the destination network.
     * @param {number} params.originNetworkChainId - The chain ID of the origin network.
     * @param {SignerOrProviderOrRpc} [params.originSignerOrProviderOrRpc] - Optional signer, provider, or RPC string for the origin network.
     * @param {SignerOrProviderOrRpc} [params.destinationSignerOrProviderOrRpc] - Optional signer, provider, or RPC string for the destination network.
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
        super({
            txHash,
            destinationNetworkChainId,
            originNetworkChainId,
            originSignerOrProviderOrRpc,
            destinationSignerOrProviderOrRpc,
        });
    }

    /**
     * Overrides the method to fetch the status of the CCTP-specific transfer.
     */
    async getStatus(): Promise<any> {
        const transactionReceipt = await this.originProvider.getTransactionReceipt(this.txHash)
        function getMessageBytesFromEventLogs(
            logs: Log[],
            topic: string
        ): Bytes {
            const eventTopic = id(topic)
            const log = logs.filter((l) => l.topics[0] === eventTopic)[0]
            return defaultAbiCoder.decode(['bytes'], log.data)[0] as Bytes
        }
        function getMessageHashFromBytes(message: Bytes): string {
            return keccak256(message)
        }

        // function getNoncefromEventLogs(
        //     logs: Log[],
        //     topic: string
        // ): Bytes {
        //     const eventTopic = id(topic)
        //     const log = logs.filter((l) => l.topics[0] === eventTopic)[0]
        //     const  defaultAbiCoder.decode(['uint64'], log.data)[0] as Bytes
        // }



        if (transactionReceipt) {
            const { status, logs } = transactionReceipt

            const messageType = 'MessageSent(bytes)'
            // Success

                if (messageType) {
                    // decode log to get messageBytes
                    const messageBytes = getMessageBytesFromEventLogs(logs, messageType)
                    const nonce =
                    this.messageBytes = messageBytes
                    // hash the message bytes
                    const messageHash = getMessageHashFromBytes(messageBytes)
                    console.log({messageHash})
                    const attestation = await getAttestation(messageHash)
                    console.log({attestation})
                    if (attestation != null) {
                        const { status, message } = attestation

                        // Success
                        if (status === AttestationStatus.complete && message !== null) {
                            const newTransaction = {
                                // ...transaction,
                                signature: message,
                            }
                            this.signature = message
                            return {status: BridgeTransferStatus.CCTP_COMPLETE}
                            // setTransaction(txHash, newTransaction)
                            // setSignature(message)

                            // handleComplete()
                            // clearInterval(interval)
                        }
                    } else {
                        return {status: BridgeTransferStatus.CCTP_PENDING}
                    }

                    // return handleSuccess({ messageBytes, messageHash })
                } else {
                    // return handleSuccess()
                }

        }

    }


    /**
     * Overrides the method to fetch detailed transfer information, adding CCTP-specific logic.
     * @returns {Promise<any>} Transfer information specific to CCTP.
     */
    async getInfo(): Promise<any> {
        const tx = await this.originProvider.getTransaction(this.txHash);
        if (!tx) {
            throw new Error('Transaction not found');
        }

        const {originNetworkChainId, destinationNetworkChainId, isDeposit, originName, destinationName, txHash} = this

        let info: BridgeTransferInfo = {
            txHash,
            transferType: isDeposit ? BridgeTransferType.DEPOSIT_CCTP : BridgeTransferType.WITHDRAW_CCTP,
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
        const inputs = await getDecodedInputs(tx, TokenMessengerAbi)
        console.log(inputs.args[1], typeof inputs.args[1])
        info.to = `0x${inputs.args[1].toString().slice(-40)}`
        info.amount = inputs.args[0]
        info.tokenSymbol = 'USDC'
        info.tokenDestinationAddress = chainIdToUSDC(destinationNetworkChainId) ?? ''
        return info
    }



    /**
     * Overrides the method to execute the transfer, adding CCTP-specific logic.
     * @param {ethers.Signer} signer - The signer instance to execute the transfer.
     * @returns {Promise<ethers.ContractReceipt>} The receipt of the executed transfer.
     */
    async execute(signer: ethers.Signer): Promise<ethers.ContractReceipt> {

        const CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES = {
            [11155111]: '0x7865fafc2db2093669d92c0f33aeef291086befd',
            [421614]: '0xacf1ceef35caac005e15888ddb8a3515c41b4872',
        }

        const MESSAGE_TRANSMITTER_CONTRACT_ADDRESS =
            CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES[this.destinationNetworkChainId as keyof typeof CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES]
        const contract = new ethers.Contract(
            MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
            MessageTransmitterAbi,
            signer
        );
        return contract.receiveMessage(this.messageBytes, this.signature);
    }

    /**
     * Overrides the method to fetch the deposit status for CCTP.
     * @returns {Promise<any>} The status of the deposit specific to CCTP.
     */
    async getDepositStatus(): Promise<any> {
        // TODO: Implement CCTP-specific logic to fetch the deposit status.
        throw new Error('CCTP-specific getDepositStatus method not implemented.');
    }
}
