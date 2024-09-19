import { Request, Response } from 'express';

import { FaucetService } from '../services';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true'
};

export class FaucetController {
  private faucetService: FaucetService;
  constructor() {
    this.faucetService = new FaucetService();
  }

  async sendTokens(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const response = await this.faucetService.send(recipientAddress);
      return res.status(200).header(corsHeaders).send({ status: 'success', result: response });
    } catch (error) {
      return res.status(500).header(corsHeaders).send({ status: 'error', result: error });
    }
  }

  async getLastSentTimestamp(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const response = await this.faucetService.lastSentTimestamp(recipientAddress);
      return res.status(200).header(corsHeaders).send({ status: 'success', result: response });
    } catch (error) {
      console.error(error);
      return res.status(500).header(corsHeaders).send({ status: 'error', result: error });
    }
  }

  async getInterval(req: Request, res: Response) {
    try {
      const response = await this.faucetService.getInterval();
      return res.status(200).header(corsHeaders).send({ status: 'success', result: response });
    } catch (error) {
      return res.status(500).header(corsHeaders).send({ status: 'error', result: error });
    }
  }

  async getRemainingTime(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const response = await this.faucetService.getRemainingTime(recipientAddress);
      return res.status(200).header(corsHeaders).send({ status: 'success', result: response });
    } catch (error) {
      return res.status(500).header(corsHeaders).send({ status: 'error', result: error });
    }
  }
}
