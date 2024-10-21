// src/controllers/pool.controller.ts
import { Request, Response } from 'express';
import { getAllPoolPositions, getPoolDetails } from '../services/staker.service';

export class PoolController {
    public async getAllPositions(req: Request, res: Response): Promise<Response> {
        console.log("Received poolId:", req.params.poolId);
        try {
            const positions = await getAllPoolPositions(req.params.poolId);
            return res.status(200).json(positions);
        } catch (error) {
            console.error("Error fetching positions:", error);
            return res.status(500).send('Internal server error');
        }
    }

    public async getPoolDetails(req: Request, res: Response): Promise<Response> {
        console.log("Received poolId:", req.params.poolId);
        try {
            const poolDetails = await getPoolDetails(req.params.poolId);
            return res.status(200).json(poolDetails);
        } catch (error) {
            console.error("Error fetching pool details:", error);
            return res.status(500).send('Internal server error');
        }
    }

}