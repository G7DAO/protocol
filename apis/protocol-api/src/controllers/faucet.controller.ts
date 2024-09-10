import { Request, Response } from 'express';

import { FaucetService } from '../services';

export class FaucetController {
  private faucetService: FaucetService;
  constructor() {
    this.faucetService = new FaucetService();
  }

  async requestFaucet(req: Request, res: Response) {
    try {
      const { recipientAddress } = req.params;
      const response = await this.faucetService.requestFaucet(recipientAddress);
      return res.status(200).send({ status: 'success', message: response });
    } catch (error) {
      return res.status(500).send({ status: 'error', message: error });
    }
  }
}
