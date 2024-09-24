import cors from 'cors';
import { allowedOrigins } from '../config';

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins['*']) {
      callback(null, '*');
    } else if (allowedOrigins[origin]) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

export const corsMiddleware = cors(corsOptions);
