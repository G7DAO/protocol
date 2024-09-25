import http from 'node:http';

import express, { Request, Response } from 'express';

import { API_PORT, API_HOST, allowedOriginsArray } from './config';
import routes from './routes';
import { corsMiddleware } from './middlewares/cors.middleware';

const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(corsMiddleware);

const server = http.createServer(app);

app.route('/ping').get((req: Request, res: Response) => {
  res.send({ status: 'ok' });
});

app.route('/status').get((req: Request, res: Response) => {
  res.send({
    cors_whitelist: allowedOriginsArray,
  });
});

app.use('/api', routes());

server
  .listen({ port: API_PORT, hostname: API_HOST }, async () => {
    console.info(`server running on host : ${API_HOST}:${API_PORT}`);
  })
  .on('error', (error) => console.error(error));
