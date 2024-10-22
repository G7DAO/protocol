// src/routes/bridge.router.ts
import { Router, Request, Response } from 'express';
import { BridgeController } from '../controllers/bridge.controller';

const router = Router();
const bridgeController = new BridgeController();

/**
 * @swagger
 * /bridge/{address}/transactions:
 *   get:
 *     summary: Get transaction history for a given address.
 *     description: Retrieve transaction history associated with the specified address.
 *     parameters:
 *       - in: path
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: The address to retrieve transaction history for.
 *     responses:
 *       '200':
 *         description: Successfully retrieved transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       '500':
 *         description: Internal server error.
 */
router.get('/:address/transactions', (req: Request, res: Response) =>
    bridgeController.getTransactionHistory(req, res)
);

export default router;
