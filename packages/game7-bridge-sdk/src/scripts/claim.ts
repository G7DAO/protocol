import { ethers} from 'ethers';
import { networks } from '../networks';
import {BridgeTransfer, BridgeTransferStatus} from "../bridgeTransfer";

const transactions = [
    {txHash: '0xedb3aa0d7af03907a52cd7251c021868c2ddcb72a56b9807946b6658b8b2103b', originNetworkChainId: 421614, destinationNetworkChainId: 11155111},
];
async function claim(txs: Array<{destinationNetworkChainId: number; originNetworkChainId: number; txHash: string }>) {
    const key = process.env.KEY

    for (const tx  of txs) {
        const bridgeTransfer = new BridgeTransfer({
            txHash: tx.txHash,
            destinationNetworkChainId: tx.destinationNetworkChainId,
            originNetworkChainId: tx.originNetworkChainId,
        });
        console.log('.........................')
        console.log('fetching info...')
        const destinationNetwork = networks[tx.destinationNetworkChainId]
        const destinationProvider = new ethers.providers.JsonRpcProvider(destinationNetwork.rpcs[0]);
        const signer = new ethers.Wallet(key, destinationProvider);
        const info = await bridgeTransfer.getInfo();
        console.log({info});
        console.log('fetching status...')

        const status = await bridgeTransfer.getStatus();
        console.log(status)

        const statusName = Object.entries(BridgeTransferStatus).find(([key, val]) => val === status?.status)?.[0];

        console.log(`${new Date().toLocaleTimeString()} - Status: ${status.status} ${statusName ?? ''}`);
        console.log('claiming...')
        const res = await bridgeTransfer.execute(signer)
        console.log(res);
        console.log('.........................')
    }
}

claim(transactions);

