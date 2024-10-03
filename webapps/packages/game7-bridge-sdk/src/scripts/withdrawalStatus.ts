import { ethers } from 'ethers';
import { BridgeTransfer } from '../bridgeTransfer';

const transactions = [{txHash: '0x3b3581e5000f84ddfd22e61e6a800a01ceba6246fb2042816967a0034978e9ec', originNetworkChainId: 421614, destinationNetworkChainId: 11155111},
{txHash: '0xb5ba500f030e662a3bd4742c8f090b819881c508c9b748d699cf7820253afea8', originNetworkChainId: 421614, destinationNetworkChainId: 11155111}

];

async function processTransactions(transactions: Array<{ txHash: string; destinationNetworkChainId: number; originNetworkChainId: number }>) {
  console.log('.........................')
  for (const tx of transactions) {
    try {
      // Create a new BridgeTransfer instance for each transaction
      const bridgeTransfer = new BridgeTransfer({
        txHash: tx.txHash,
        destinationNetworkChainId: tx.destinationNetworkChainId,
        originNetworkChainId: tx.originNetworkChainId,
      });

      // Get the status of the transaction
      // const status = await bridgeTransfer.getStatus();
      const inputs = await bridgeTransfer.getTransactionInputs();
      console.log(inputs)
      // Print the status to the console
      console.log(`Transaction Hash: ${tx.txHash}`);
      console.log(`Origin Network: ${bridgeTransfer.originName}`);
      console.log(`Destination Network: ${bridgeTransfer.destinationName}`);
      // console.log(`Status: ${status.status}`);
      // console.log(`ETA: ${status.ETA ? new Date(Date.now() + status.ETA) : 'N/A'}`);
      // console.log(`Origin Timestamp: ${new Date(status.originTimestamp)}`);
      console.log('------------------------------');
    } catch (error) {
      console.error(`Failed to process transaction ${tx.txHash}:`, error);
    }
  }
}

// Run the script
processTransactions(transactions);
