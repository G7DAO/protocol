import { ethers } from 'ethers';
import * as fs from 'fs';
import { getArgFromCLI } from '../../helpers/cli';
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import SafeApiKit from '@safe-global/api-kit';
import Safe, { SafeConfigWithSafeAddress } from '@safe-global/protocol-kit';
import { TxServiceUrl } from '../../helpers/safe';

async function main() {
    const rpcUrl = getArgFromCLI('--rpc');
    const keyfileLocation = getArgFromCLI('--keyfile');
    const password = getArgFromCLI('--password');
    const safeAddress = getArgFromCLI('--safe');

    if (!rpcUrl || !keyfileLocation || !password || !safeAddress) {
        console.error('Missing required arguments');
        return process.exit(1);
    }

    if (!ethers.isAddress(safeAddress)) {
        console.error('Safe address is invalid');
        return process.exit(1);
    }
    const keyfileJson = fs.readFileSync(keyfileLocation, 'utf8');
    const wallet = await ethers.Wallet.fromEncryptedJson(keyfileJson, password);

    const config: SafeConfigWithSafeAddress = {
        provider: rpcUrl,
        signer: wallet.privateKey,
        isL1SafeSingleton: true,
        safeAddress
    };

    const safe = await Safe.init(config);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const chainId = (await provider.getNetwork()).chainId;

    const safeTransactionData: MetaTransactionData = {
        to: safeAddress,
        data: '0x095ea7b300000000000000000000000067c6eeaeb81fc351bf1ba99c653590e11ac6b4ce0000000000000000000000000000000000000000000000001e87f85809dc0000', // approve(address,uint256)
        value: '0',
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

main()
    .then(() => process.exit(0))
    .catch((error) => {
        
            console.error(error);
        process.exit(1);
    });
