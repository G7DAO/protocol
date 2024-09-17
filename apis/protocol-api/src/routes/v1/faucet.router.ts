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
    (req: Request, res: Response) => faucetController.sendTokens(req, res)
  );

  FaucetRouter.get('/timestamp/:recipientAddress', 
    zodValidor(requestFaucetPayload),
    (req: Request, res: Response) => faucetController.getLastSentTimestamp(req, res)
  );
  FaucetRouter.get('/interval',  
    (req: Request, res: Response) => faucetController.getInterval(req, res)
  );

  FaucetRouter.get('/countdown/:recipientAddress', 
    zodValidor(requestFaucetPayload),
    (req: Request, res: Response) => faucetController.getRemainingTime(req, res)
  );

  return FaucetRouter;
};

export default faucetRoutes;
