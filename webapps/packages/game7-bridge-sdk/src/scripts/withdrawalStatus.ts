import { ethers } from 'ethers';
import { BridgeTransfer } from '../bridgeTransfer';

const transactions = [
{txHash: '0x4425be5ed93245e0424cce52d8bac9008679d188c8317a2ecdc5b8f35f360ba1', originNetworkChainId: 13746, destinationNetworkChainId: 421614}
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
      const status = await bridgeTransfer.getStatus();
      console.log(status)
      const inputs = await bridgeTransfer.getTransactionInputs();
      console.log(inputs)
      // Print the status to the console
      console.log(`Transaction Hash: ${tx.txHash}`);
      console.log(`Origin Network: ${bridgeTransfer.originName}`);
      console.log(`Destination Network: ${bridgeTransfer.destinationName}`);
      console.log(`Status: ${status.status}`);
      console.log(`ETA: ${status.ETA ? new Date(Date.now() + status.ETA) : 'N/A'}`);
      // console.log(`Origin Timestamp: ${new Date(status.originTimestamp)}`);
      console.log('------------------------------');
    } catch (error) {
      console.error(`Failed to process transaction ${tx.txHash}:`, error);
    }
  }
}

async function main() {
  const log = new Map<string, { lastStatus: any, history: Array<{ time: Date, status: any }> }>();
  const interval = 5 * 1000; // 15 seconds
  const duration = 30 * 60 * 1000; // 30 minutes
  const startTime = Date.now();

  while (Date.now() - startTime < duration) {
    await processTransactions(transactions, log);
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.log('Tracking complete. Status change log:');
  log.forEach((value, txHash) => {
    console.log(`Transaction: ${txHash}`);
    value.history.forEach(entry => {
      console.log(`Time: ${entry.time.toLocaleTimeString()}, Status: ${entry.status}`);
    });
  });
}

main();
