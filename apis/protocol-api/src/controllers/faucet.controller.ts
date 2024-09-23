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
      const response = await this.faucetService.send(recipientAddress);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      return res.status(500).send({ status: 'error', result: error });
    }
  }

  async getLastSentTimestamp(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const response = await this.faucetService.lastSentTimestamp(recipientAddress);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ status: 'error', result: error });
    }
  }

  async getInterval(req: Request, res: Response) {
    try {
      const response = await this.faucetService.getInterval();
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      return res.status(500).send({ status: 'error', result: error });
    }
  }

  async getRemainingTime(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const response = await this.faucetService.getRemainingTime(recipientAddress);
      return res.status(200).send({ status: 'success', result: response });
    } catch (error) {
      return res.status(500).send({ status: 'error', result: error });
    }
  }
}
