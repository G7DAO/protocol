import { ethers } from 'ethers';
import { BridgeTransfer } from '../bridgeTransfer';

const transactions = [
  // {txHash: '0x458e561a291c99325a81cb0f686b7cea5a633f498167f2ac14a69c898223d5cd', originNetworkChainId: 11155111, destinationNetworkChainId: 421614}, //L1->L2 ETH
  {txHash: '0x9957a9a1b479e2cbc9dc95e15bd737d85301b31ad45d2a007fc9b3ba1870aa23', originNetworkChainId: 11155111, destinationNetworkChainId: 421614}, //L1->L2 TG7
  {txHash: '0x05b4024deff28ca7b29336c49ca341f403d4a5be2e72717f3250b2a13ce11d2c', originNetworkChainId: 421614, destinationNetworkChainId: 13746 } //L2->L3 TG7

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
      const status = await bridgeTransfer.getDepositStatus();
      console.log(status);

    } catch (error) {
      console.error(`Failed to process transaction ${tx.txHash}:`, error);
    }
  }
}

// Run the script
processTransactions(transactions);
