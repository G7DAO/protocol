import { Router, Request, Response } from 'express';

import { zodValidor } from '../../middlewares/zodValidator.middleware';
import { FaucetController } from '../../controllers';
import { requestFaucetPayload } from '../../payloads/faucet.payload';

const faucetRoutes = (): Router => {
  const FaucetRouter = Router();
  const faucetController = new FaucetController();

  FaucetRouter.post(
    '/request/:recipientAddress',
    zodValidor(requestFaucetPayload),
    (req: Request, res: Response) => faucetController.requestFaucet(req, res)
  );

  return FaucetRouter;
};

export default faucetRoutes;
