import { Router, Request, Response } from 'express';

import { zodValidor } from '../middlewares/zodValidator.middleware';
import { FaucetController } from '../controllers';
import { requestFaucetPayload } from '../payloads/faucet.payload';

const faucetRoutes = (): Router => {
  const FaucetRouter = Router();
  const faucetController = new FaucetController();

  /**
   * @swagger
   * /faucet/request/{recipientAddress}:
   *   get:
   *     summary: Request tokens from the faucet.
   *     description: Request tokens from the faucet.
   *     parameters:
   *       - in: path
   *         name: recipientAddress
   *         schema:
   *           type: string
   *         required: true
   *         description: The recipient address to request tokens from.
   *     responses:
   *       '200':
   *         description: A successful response
   *       '429':
   *         description: Too many requests
   *       '500':
   *         description: Internal server error
   */
  FaucetRouter.post(
    '/request/:recipientAddress',
    zodValidor(requestFaucetPayload),
    (req: Request, res: Response) => faucetController.sendTokens(req, res)
  );

  /**
   * @swagger
   * /faucet/timestamp/{recipientAddress}:
   *   get:
   *     summary: Get the last timestamp when tokens were sent to the recipient.
   *     description: Get the last timestamp when tokens were sent to the recipient.
   *     parameters:
   *       - in: path
   *         name: recipientAddress
   *         schema:
   *           type: string
   *         required: true
   *         description: The recipient address to get the last timestamp for.
   *     responses:
   *       '200':
   *         description: A successful response
   *       '404':
   *         description: Recipient address not found
   */
  FaucetRouter.get(
    '/timestamp/:recipientAddress',
    zodValidor(requestFaucetPayload),
    (req: Request, res: Response) =>
      faucetController.getLastSentTimestamp(req, res)
  );

  /**
   * @swagger
   * /faucet/interval:
   *   get:
   *     summary: Get the interval between requests.
   *     description: Get the interval between requests.
   *     responses:
   *       '200':
   *         description: A successful response
   */
  FaucetRouter.get('/interval', (req: Request, res: Response) =>
    faucetController.getInterval(req, res)
  );

  /**
   * @swagger
   * /faucet/countdown/{recipientAddress}:
   *   get:
   *     summary: Get the remaining time until the next request.
   *     description: Get the remaining time until the next request.
   *     parameters:
   *       - in: path
   *         name: recipientAddress
   *         schema:
   *           type: string
   *         required: true
   *         description: The recipient address to get the remaining time for.
   *     responses:
   *       '200':
   *         description: A successful response
   *       '404':
   *         description: Recipient address not found
   */
  FaucetRouter.get(
    '/countdown/:recipientAddress',
    zodValidor(requestFaucetPayload),
    (req: Request, res: Response) => faucetController.getRemainingTime(req, res)
  );

  return FaucetRouter;
};

export default faucetRoutes;
