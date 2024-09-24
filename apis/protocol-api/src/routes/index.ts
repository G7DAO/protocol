import { Router } from 'express';

import faucetRouter from './faucet.router';
import cors from 'cors';

const setupRouter = (): Router => {
  const router = Router();
  // CORS configuration
  const allowedOrigins = process.env.PROTOCOL_API_CORS?.split(',') || [];
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  };

  // Apply CORS middleware to all routes
  router.use(cors(corsOptions));

  router.use('/faucet', faucetRouter());

  return router;
};

export default setupRouter;
