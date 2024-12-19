import {
    BridgeTransfer,
    BridgeTransferInfo,
    BridgeTransferStatus,
    BridgeTransferType,
    SignerOrProviderOrRpc
} from './bridgeTransfer';
import {ethers} from 'ethers';
import {networks} from "./networks";

import type {Bytes} from 'ethers/lib/utils'
import {defaultAbiCoder, id, keccak256} from 'ethers/lib/utils'
import type {Log} from '@ethersproject/providers'
import {AttestationStatus, getAttestation} from "./utils/attestationService";
import {MessageTransmitterAbi} from "./abi/MessageTransmitterContract";
import {getDecodedInputs} from "./utils/web3Utils";
import {TokenMessengerAbi} from "./abi/TokenMessagerABI";
import {chainIdToUSDC, getCctpContracts, getCctpUtils, hashSourceAndNonce, isCctp} from "./utils/cctp";
import {TransactionResponse} from "@ethersproject/abstract-provider/src.ts";

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
        const {fetchMessages, checkNonce, fetchAttestation} = getCctpUtils({originChainId: this.originNetworkChainId})
        const messages = (await fetchMessages(this.txHash)).messages

        if (messages) {
            const nonce = messages[0].eventNonce
            const {sourceChainDomain} = getCctpContracts({originChainId: this.originNetworkChainId})
            const sourceAndNonce = hashSourceAndNonce(sourceChainDomain, Number(nonce))
            const check = await checkNonce({nonce: sourceAndNonce, destinationProvider: this.destinationProvider})
            if (check.toString() === '1') {
                return {status: BridgeTransferStatus.CCTP_REDEEMED}
            }
        }
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



        if (transactionReceipt) {
            const { status, logs } = transactionReceipt

            const messageType = 'MessageSent(bytes)'
                if (messageType) {
                    // decode log to get messageBytes
                    const messageBytes = getMessageBytesFromEventLogs(logs, messageType)
                    this.messageBytes = messageBytes
                    // hash the message bytes
                    const messageHash = getMessageHashFromBytes(messageBytes)
                    const attestationResponse = (await fetchAttestation(messageHash)) as any
                    if (attestationResponse?.status === AttestationStatus.pending_confirmations) {
                        return {status: BridgeTransferStatus.CCTP_PENDING}
                    }
                    if (attestationResponse.attestation !== null) {
                        const { status, attestation } = attestationResponse
                        if (status === AttestationStatus.complete && attestation !== null) {
                            this.signature = attestation
                            return {status: BridgeTransferStatus.CCTP_COMPLETE}
                        }
                    } else {
                        return {status: BridgeTransferStatus.CCTP_PENDING}
                    }
                }

        }
        return {status: BridgeTransferStatus.CCTP_PENDING}
    }


    /**
     * Overrides the method to fetch detailed transfer information, adding CCTP-specific logic.
     * @returns {Promise<any>} Transfer information specific to CCTP.
     */
    async getInfo(_tx: TransactionResponse): Promise<any> {
        let tx = _tx
        if (!_tx) {
            tx = await this.originProvider.getTransaction(this.txHash);
        }

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
        info.to = `0x${inputs.args[2].toString().slice(-40)}`
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
            [1]: '0x0a992d191deec32afe36203ad87d7d289a738f81',
            [42161]: '0xc30362313fbba5cf9163f0bb16a0e01f01a896ca',
        }

        const MESSAGE_TRANSMITTER_CONTRACT_ADDRESS =
            CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES[this.destinationNetworkChainId as keyof typeof CHAIN_IDS_TO_MESSAGE_TRANSMITTER_ADDRESSES]
        const contract = new ethers.Contract(
            MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
            MessageTransmitterAbi,
            signer
        );
        const res = await contract.receiveMessage(this.messageBytes, this.signature);
        return res.wait()
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
