import { Request, Response } from 'express';
import { FaucetService } from '../services';
import { ethers } from 'ethers';
import { tokenSenderErrorDecoder } from '../utils/error';

export class FaucetController {
  private faucetService: FaucetService;
  constructor() {
    this.faucetService = new FaucetService();
  }

  async sendTokens(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const checksummedAddress = ethers.getAddress(recipientAddress);
      console.log(`[FaucetController::sendTokens] Sending tokens to ${checksummedAddress}`);
      const remainingTime = await this.faucetService.getRemainingTime(checksummedAddress);
      if (remainingTime > 0) {
        const availableAt = Date.now() + remainingTime * 1000;
        console.log(`[FaucetController::sendTokens] Too many requests. Available at: ${new Date(availableAt).toISOString()}`);
        res.setHeader('x-game7-faucet-available-at', new Date(availableAt).toISOString());
        return res.status(429).send({ status: 'error', message: 'Too many requests. Try again later.' });
      }
      const response = await this.faucetService.send(checksummedAddress);
      console.log(`[FaucetController::sendTokens] Tokens sent to ${checksummedAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error: any) {
      const decodedError = await tokenSenderErrorDecoder.decode(error);
      if(decodedError.name === "TokenSenderClaimIntervalNotPassed") {
        console.log(`[FaucetController::sendTokens] Too many requests: ${decodedError.name} - ${decodedError.args}`);
        return res.status(429).send({ status: 'error', result: "Too many requests" });
      }
      console.log(`[FaucetController::sendTokens] Error sending tokens: ${decodedError.name} - ${decodedError.args}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }

  async getLastSentTimestamp(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const checksummedAddress = ethers.getAddress(recipientAddress);
      console.log(`[FaucetController::getLastSentTimestamp] Retrieving last sent timestamp for ${checksummedAddress}`);
      const response = await this.faucetService.lastSentTimestamp(checksummedAddress);
      console.log(`[FaucetController::getLastSentTimestamp] Last sent timestamp retrieved for ${checksummedAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      const decodedError = await tokenSenderErrorDecoder.decode(error);
      console.log(`[FaucetController::getLastSentTimestamp] Error retrieving last sent timestamp: ${decodedError.name} - ${decodedError.args}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }

  async getInterval(req: Request, res: Response) {
    try {
      console.log('[FaucetController::getInterval] Retrieving interval');
      const response = await this.faucetService.getInterval();
      console.log(`[FaucetController::getInterval] Interval retrieved: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      const decodedError = await tokenSenderErrorDecoder.decode(error);
      console.log(`[FaucetController::getInterval] Error retrieving interval: ${decodedError.name} - ${decodedError.args}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }

  async getRemainingTime(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const checksummedAddress = ethers.getAddress(recipientAddress);
      console.log(`[FaucetController::getRemainingTime] Retrieving remaining time for ${checksummedAddress}`);
      const response = await this.faucetService.getRemainingTime(checksummedAddress);
      console.log(`[FaucetController::getRemainingTime] Remaining time retrieved for ${checksummedAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      const decodedError = await tokenSenderErrorDecoder.decode(error);
      console.log(`[FaucetController::getRemainingTime] Error retrieving remaining time: ${decodedError.name} - ${decodedError.args}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }
  async getBalance(req: Request, res: Response) {
    try {
      console.log(`[FaucetController::getBalance] Retrieving faucet balance`);
      const { address, balance } = await this.faucetService.getBalance();
      console.log(`[FaucetController::getBalance] Signer Address: ${address}, Balance: ${balance} ETH`);
      return res.status(200).send({ status: 'success', result: { address, balance } });
    } catch (error: any) {
      const decodedError = await tokenSenderErrorDecoder.decode(error);
      console.log(`[FaucetController::getBalance] Error retrieving balance: ${decodedError.name} - ${decodedError.args}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }
}
