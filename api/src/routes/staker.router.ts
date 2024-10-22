// src/routes/pool.router.ts
import { Router, Request, Response } from 'express';
import { PoolController } from '../controllers/staker.controller';

const router = Router();
const poolController = new PoolController();

/**
 * @swagger
 * /pool/{poolId}/positions:
 *   get:
 *     summary: Get all positions for a poolId on the Game7 testnet.
 *     description: Retrieve all positions associated with the specified poolId on the Game7 testnet.
 *     parameters:
 *       - in: path
 *         name: poolId
 *         schema:
 *           type: string
 *         required: true
 *         description: The pool ID to retrieve positions for.
 *     responses:
 *       '200':
 *         description: Successfully retrieved positions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       '500':
 *         description: Internal server error.
 */
router.get('/:poolId/positions', (req: Request, res: Response) =>
    poolController.getAllPositions(req, res)
);


/**
    * @swagger
    * /pool/{poolId}:
    *   get:
    *     summary: Get general staking details on Game7 testnet for a poolId.
    *     description: Retrieve general staking details associated with the specified poolId on the Game7 testnet.
    *     parameters:
    *       - in: path
    *         name: poolId
    *         schema:
    *           type: string
    *         required: true
    *         description: The pool ID to retrieve details for.
    *     responses:
    *       '200':
    *         description: Successfully retrieved staking details.
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *       '500':
    *         description: Internal server error.
    */
router.get('/:poolId', (req: Request, res: Response) =>
    poolController.getPoolDetails(req, res)
);

export default router;
