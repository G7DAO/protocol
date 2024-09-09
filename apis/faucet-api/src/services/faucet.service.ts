import { ethers } from 'ethers';
import { TokenSenderABI } from '../abis/TokenSenderABI';
import { GAME7_TESTNET_RPC_URL, TOKEN_SENDER_ADDRESS } from '../config';

export class FaucetService {
  tokenSender: ethers.Contract;
  constructor() {
    const provider = new ethers.JsonRpcProvider(GAME7_TESTNET_RPC_URL);
    this.tokenSender = new ethers.Contract(
      TOKEN_SENDER_ADDRESS,
      TokenSenderABI,
      provider
    );
  }

  async requestFaucet(recipientAddress: string) {
      const tx = await this.tokenSender.send(recipientAddress);
      await tx.wait();
      return tx.hash
  }
}
