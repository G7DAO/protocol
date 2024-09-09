import express, { Request, Response } from 'express';

import routesV1 from './routes/v1';

const app = express();
app.use(express.json());
app.use(express.urlencoded());

app.route('/').get((req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use('/api/v1', routesV1);

export default app;
