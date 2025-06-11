import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import emailRouter from './routes/email';

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.use('/api', emailRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(8888);