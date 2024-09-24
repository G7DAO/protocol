import { Router } from 'express';
import faucetRouter from './faucet.router';
import { corsMiddleware } from '../middlewares/cors.middleware';

const setupRouter = (): Router => {
  const router = Router();

  router.use(corsMiddleware);
  router.use('/faucet', faucetRouter());

  return router;
};

export default setupRouter;
