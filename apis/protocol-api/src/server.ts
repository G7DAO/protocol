import http from 'node:http';

import express, { Request, Response } from 'express';

import { API_PORT, API_HOST } from './config';
import routes from './routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded());

const server = http.createServer(app);

app.route('/').get((req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use('/api', routes());

server
  .listen({ port: API_PORT, hostname: API_HOST }, async () => {
    console.info(`server running on host : ${API_HOST}:${API_PORT}`);
  })
  .on('error', (error) => console.error(error));
