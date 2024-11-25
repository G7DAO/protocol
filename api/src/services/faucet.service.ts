import { ethers } from 'ethers';
import { TokenSenderABI } from '../abis/TokenSenderABI';
import {
  GAME7_TESTNET_RPC_URL,
  KMS_CREDENTIALS,
  TOKEN_SENDER_ADDRESS,
  TOKEN_SENDER_AMOUNT,
} from '../config';
import { AwsKmsSigner } from '../utils/ethers-aws-kms-signer';
import { toUnixTimestamp } from '../utils/date';

export class FaucetService {
  tokenSender: ethers.Contract;
  provider: ethers.JsonRpcProvider;
  signer: AwsKmsSigner;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(GAME7_TESTNET_RPC_URL);
     this.signer = new AwsKmsSigner(
      {
        region: KMS_CREDENTIALS.region,
        keyId: KMS_CREDENTIALS.keyId,
        credentials: {
          accessKeyId: KMS_CREDENTIALS.accessKeyId,
          secretAccessKey: KMS_CREDENTIALS.secretAccessKey,
        },
      },
      this.provider
    );
    this.tokenSender = new ethers.Contract(
      TOKEN_SENDER_ADDRESS,
      TokenSenderABI,
      this.signer
    );
  }

  async send(recipientAddress: string) {
    const tx = await this.tokenSender.send(recipientAddress, {
      value: TOKEN_SENDER_AMOUNT,
    });
    await tx.wait();
    return tx.hash;
  }

  async lastSentTimestamp(recipientAddress: string) {
    const lastSentTimestamp =
      await this.tokenSender.lastSentTimestamp.staticCall(recipientAddress);
    return Number(lastSentTimestamp);
  }

  async getInterval() {
    const interval = await this.tokenSender.faucetTimeInterval.staticCall();
    return Number(interval);
  }

  async getRemainingTime(recipientAddress: string) {
    const lastSentTimestamp = await this.lastSentTimestamp(recipientAddress);
    const interval = await this.getInterval();
    const remainingTime = interval - (toUnixTimestamp(new Date()) - lastSentTimestamp);
    if (remainingTime <= 0) return 0;
    else return remainingTime;
  }
  async getBalance() {
    const signerAddress = await this.signer.getAddress();
    const balance = await this.provider.getBalance(signerAddress);

    return {
      address: signerAddress,
      balance: ethers.formatEther(balance),
    };   
  }
}
