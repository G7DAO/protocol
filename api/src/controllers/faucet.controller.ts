import { Request, Response } from 'express';
import { FaucetService } from '../services';
import { ethers } from 'ethers';

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
      const response = await this.faucetService.send(checksummedAddress);
      console.log(`[FaucetController::sendTokens] Tokens sent to ${checksummedAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      console.log(`[FaucetController::sendTokens] Error sending tokens: ${error}`);
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
      console.log(`[FaucetController::getLastSentTimestamp] Error retrieving last sent timestamp: ${error}`);
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
      console.log(`[FaucetController::getInterval] Error retrieving interval: ${error}`);
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
      console.log(`[FaucetController::getRemainingTime] Error retrieving remaining time: ${error}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }
}
