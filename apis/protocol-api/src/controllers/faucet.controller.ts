import { Request, Response } from 'express';
import logger from '../utils/logger';

import { FaucetService } from '../services';

export class FaucetController {
  private faucetService: FaucetService;
  constructor() {
    this.faucetService = new FaucetService();
  }

  async sendTokens(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      logger.info(`[FaucetController::sendTokens] Sending tokens to ${recipientAddress}`);
      const response = await this.faucetService.send(recipientAddress);
      logger.info(`[FaucetController::sendTokens] Tokens sent to ${recipientAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      logger.error(`[FaucetController::sendTokens] Error sending tokens: ${error}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }

  async getLastSentTimestamp(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      logger.info(`[FaucetController::getLastSentTimestamp] Retrieving last sent timestamp for ${recipientAddress}`);
      const response = await this.faucetService.lastSentTimestamp(recipientAddress);
      logger.info(`[FaucetController::getLastSentTimestamp] Last sent timestamp retrieved for ${recipientAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      logger.error(`[FaucetController::getLastSentTimestamp] Error retrieving last sent timestamp: ${error}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }

  async getInterval(req: Request, res: Response) {
    try {
      logger.info('[FaucetController::getInterval] Retrieving interval');
      const response = await this.faucetService.getInterval();
      logger.info(`[FaucetController::getInterval] Interval retrieved: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      logger.error(`[FaucetController::getInterval] Error retrieving interval: ${error}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }

  async getRemainingTime(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      logger.info(`[FaucetController::getRemainingTime] Retrieving remaining time for ${recipientAddress}`);
      const response = await this.faucetService.getRemainingTime(recipientAddress);
      logger.info(`[FaucetController::getRemainingTime] Remaining time retrieved for ${recipientAddress}: ${response}`);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      logger.error(`[FaucetController::getRemainingTime] Error retrieving remaining time: ${error}`);
      return res.status(500).send({ status: 'error', result: "Internal server error" });
    }
  }
}
