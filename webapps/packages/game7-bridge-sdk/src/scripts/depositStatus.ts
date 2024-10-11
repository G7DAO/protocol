import { BridgeTransfer } from '../bridgeTransfer';

const transactions = [
  {txHash: '0x2fce35c0ea706b1fa2a261453782c2adf11b1c4b6e8b230859ca6010fcb2fcd8', originNetworkChainId: 11155111, destinationNetworkChainId: 421614}, //L1->L2 ETH
  {txHash: '0x9957a9a1b479e2cbc9dc95e15bd737d85301b31ad45d2a007fc9b3ba1870aa23', originNetworkChainId: 11155111, destinationNetworkChainId: 421614}, //L1->L2 TG7
  // {txHash: '0x05b4024deff28ca7b29336c49ca341f403d4a5be2e72717f3250b2a13ce11d2c', originNetworkChainId: 421614, destinationNetworkChainId: 13746 }, //L2->L3 TG7
  // {txHash: '0xae64c39527cfa697f5e3a2b56d31b9ee7fdd852678f787e4ab0e4e020033de29', originNetworkChainId: 13746, destinationNetworkChainId: 421614 }, //L3->L2 TG7
  // {txHash: '0xb5ba500f030e662a3bd4742c8f090b819881c508c9b748d699cf7820253afea8', originNetworkChainId: 421614, destinationNetworkChainId: 11155111}, //L2->L1 ETH

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
      // const status = await bridgeTransfer.getDepositStatus();
      // const res = await bridgeTransfer.getInfo()
      const res = await bridgeTransfer.getStatus()
      console.log(res);
      console.log('.........................')

    } catch (error) {
      console.error(`Failed to process transaction ${tx.txHash}:`, error);
    }
  }
  console.log('.........................')
}

// Run the script
processTransactions(transactions);
