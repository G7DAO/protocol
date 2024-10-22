import cors from "cors";
import express, { Application, Request, Response } from "express";
import {
    getTransactionHistory,
    getPoolDetails,
    getAllPoolPositions
} from "./actions";

const app: Application = express();
app.use(cors());

// Number of hits in Pete Rose's career
const PORT: number = 4256;

app.get("/ping", (_: Request, res: Response) => {
    const ping = { status: "ok" };
    return res.status(200).json(ping);
});


// Get all users transaction history cross blockchains(sepilia, arbitrum sepolia, game7testnet)
app.get("/history/:address", async (req: Request, res: Response) => {

    console.log("req.params.address", req.params.address);
    let stats: object | string = await getTransactionHistory(req.params.address);
    if (typeof stats == "string") {
        return res.status(500).send(stats);
    } else {
        return res.status(200).json(stats);
    }
});

// Get general staking details on game7 testnet for a poolId
app.get("/pool/:poolId", async (req: Request, res: Response) => {
    console.log("req.params.poolId", req.params.poolId);
    let poolDetails: object | string = await getPoolDetails(req.params.poolId);
    if (typeof poolDetails == "string") {
        return res.status(500).send(poolDetails);
    } else {
        return res.status(200).json(poolDetails);
    }
});

// Get all positions for a poolId on game7 testnet
app.get("/pool/:poolId/positions", async (req: Request, res: Response) => {
    console.log("req.params.poolId", req.params.poolId);
    let positions: object | string = await getAllPoolPositions(req.params.poolId);
    if (typeof positions == "string") {
        return res.status(500).send(positions);
    } else {
        return res.status(200).json(positions);
    }
});

app.listen(PORT, (): void => {
    console.log("SERVER IS UP ON PORT:", PORT);
});