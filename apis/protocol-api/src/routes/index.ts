import { Router } from 'express';

import faucetRouter from './faucet.router';

const setupRouter = (): Router => {
  const router = Router();
  router.use('/faucet', faucetRouter());

  return router;
};

export default setupRouter;
