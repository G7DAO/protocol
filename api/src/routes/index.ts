import { Router } from 'express';
import faucetRouter from './faucet.router';
import stakerRouter from './staker.router';
import bridgeRouter from './bridge.router';

const setupRouter = (): Router => {
  const router = Router();
  router.use('/faucet', faucetRouter());
  router.use('/staker', stakerRouter);
  router.use('/bridge', bridgeRouter);
  return router;
};

export default setupRouter;
