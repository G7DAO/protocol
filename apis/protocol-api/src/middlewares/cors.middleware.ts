import cors from 'cors';

// Parse allowed origins
const allowedOriginsStr = process.env.PROTOCOL_API_CORS_WHITELIST || '';
const allowedOriginsArray = allowedOriginsStr.split(',').filter(Boolean);

const allowedOrigins: { [key: string]: boolean } = allowedOriginsArray.reduce((acc, origin) => ({ ...acc, [origin]: true }), {});

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || !allowedOriginsArray.length) {
      callback(null, "*");
    } else if (allowedOrigins[origin]) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

export const corsMiddleware = cors(corsOptions);