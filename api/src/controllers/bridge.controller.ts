// src/controllers/bridge.controller.ts
import { Request, Response } from 'express';
import { getTransactionHistory } from '../services/bridge.service';

export class BridgeController {
    public async getTransactionHistory(req: Request, res: Response): Promise<Response> {
        console.log('Received address:', req.params.address);
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10; // Default limit value if not provided
            const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0; // Default offset value if not provided
            console.log('Limit:', limit);
            console.log('Offset:', offset);
            const transactions = await getTransactionHistory(req.params.address, limit, offset);
            return res.status(200).json(transactions);
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            return res.status(500).send('Internal server error');
        }
    }
}
