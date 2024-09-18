import express, { Request, Response } from 'express';

import routes from './routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded());

app.route('/ping').get((req: Request, res: Response) => {
  res.send({ status: 'ok' });
});

app.route('/status').get((req: Request, res: Response) => {
  res.send({ status: 'ok' });
});

app.route('/').get((req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use('/api', routes);

export default app;
