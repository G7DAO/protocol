import { BridgeTransfer } from '../bridgeTransfer';

const transactions = [
  {txHash: '0x4612f770b83929df738e4c51cd03204b902620fcec7ad830cd646fb08cb69fe1', originNetworkChainId: 11155111, destinationNetworkChainId: 421614},
];



async function processTransactions(transactions: Array<{ txHash: string; destinationNetworkChainId: number; originNetworkChainId: number }>, log: Map<string, { lastStatus: any, history: Array<{time: Date, status: any}> }>) {
  console.log('Processing transactions...');

  for (const tx of transactions) {
    try {
      const bridgeTransfer = new BridgeTransfer({
        txHash: tx.txHash,
        destinationNetworkChainId: tx.destinationNetworkChainId,
        originNetworkChainId: tx.originNetworkChainId,
        destinationSignerOrProviderOrRpc: 'https://sepolia-rollup.arbitrum.io/rpc',
        originSignerOrProviderOrRpc: 'https://ethereum-sepolia-rpc.publicnode.com',
      });

      const info = await bridgeTransfer.getInfo();
      console.log({info});
      const status = (await bridgeTransfer.getStatus())?.status;
      // console.log(status)
      console.log(`${new Date().toLocaleTimeString()} - Status: ${status}`);

      const statusLog = log.get(tx.txHash);
      if (!statusLog) {
        log.set(tx.txHash, { lastStatus: status, history: [{ time: new Date(), status }] });
      } else if (statusLog.lastStatus !== status) {
        console.log(`Status changed for ${tx.txHash} from ${statusLog.lastStatus} to ${status}`);
        statusLog.history.push({ time: new Date(), status });
        statusLog.lastStatus = status;
      }

    } catch (error) {
      console.error(`Failed to process transaction ${tx.txHash}:`, error);
    }
  }
}

async function main() {
  const log = new Map<string, { lastStatus: any, history: Array<{ time: Date, status: any }> }>();
  const interval = 5 * 1000; // 15 seconds
  const duration = 15 * 1000; //30 * 60 * 1000; // 30 minutes
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
