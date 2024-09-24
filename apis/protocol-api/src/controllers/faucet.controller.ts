import { Request, Response } from 'express';
import { FaucetService } from '../services';

export class FaucetController {
  private faucetService: FaucetService;
  constructor() {
    this.faucetService = new FaucetService();
  }

  async sendTokens(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      console.log(`[FaucetController::sendTokens] Sending tokens to ${recipientAddress}`);
      const response = await this.faucetService.send(recipientAddress);
      console.log(`[FaucetController::sendTokens] Tokens sent to ${recipientAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      console.log(`[FaucetController::sendTokens] Error sending tokens: ${error}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }

  async getLastSentTimestamp(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      console.log(`[FaucetController::getLastSentTimestamp] Retrieving last sent timestamp for ${recipientAddress}`);
      const response = await this.faucetService.lastSentTimestamp(recipientAddress);
      console.log(`[FaucetController::getLastSentTimestamp] Last sent timestamp retrieved for ${recipientAddress}: ${response}`);
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
      console.log(`[FaucetController::getRemainingTime] Retrieving remaining time for ${recipientAddress}`);
      const response = await this.faucetService.getRemainingTime(recipientAddress);
      console.log(`[FaucetController::getRemainingTime] Remaining time retrieved for ${recipientAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      console.log(`[FaucetController::getRemainingTime] Error retrieving remaining time: ${error}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }
}
