// src/controllers/bridge.controller.ts
import { Request, Response } from 'express';
import { getTransactionHistory } from '../services/bridge.service';

export class BridgeController {
    public async getTransactionHistory(req: Request, res: Response): Promise<Response> {
        console.log('Received address:', req.params.address);
        try {
            const transactions = await getTransactionHistory(req.params.address);
            return res.status(200).json(transactions);
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            return res.status(500).send('Internal server error');
        }
    }
}
