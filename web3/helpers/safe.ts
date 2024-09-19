import SafeApiKit from '@safe-global/api-kit';
import Safe, { SafeConfigWithSafeAddress } from '@safe-global/protocol-kit';
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import { TxServiceUrl } from './type';

/**
 * Create a Safe proposal
 * @param rpcUrl - The RPC URL
 * @param wallet - The wallet
 * @param safeAddress - The Safe address
 * @param to - The address to send the transaction to
 * @param data - The calldata
 * @param value - The value to send
 */
export async function createSafeProposal(
    rpcUrl: string,
    wallet: ethers.Wallet | ethers.HDNodeWallet,
    safeAddress: string,
    to: string,
    data: string,
    value: string
) {
    const config: SafeConfigWithSafeAddress = {
        provider: rpcUrl,
        signer: wallet.privateKey,
        isL1SafeSingleton: true,
        safeAddress,
    };

    const safe = await Safe.init(config);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const chainId = (await provider.getNetwork()).chainId;

    const safeTransactionData: MetaTransactionData = {
        to,
        data,
        value,
    };

    // Create a Safe transaction with the provided parameters
    const safeTransaction = await safe.createTransaction({ transactions: [safeTransactionData] });

    // Deterministic hash based on transaction parameters
    const safeTxHash = await safe.getTransactionHash(safeTransaction);

    // Sign transaction to verify that the transaction is coming from owner 1
    const senderSignature = await safe.signHash(safeTxHash);

    const apiKit = new SafeApiKit({
        chainId,
        txServiceUrl: TxServiceUrl[Number(chainId)],
    });

    console.log('Proposing transaction...');
    await apiKit.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: wallet.address,
        senderSignature: senderSignature.data,
    });
    console.log('Proposal submitted');
}
