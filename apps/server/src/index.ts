import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authOptional } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { customersRouter } from './routes/customers.js';
import { entriesRouter } from './routes/entries.js';
import { exportRouter } from './routes/export.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: ORIGIN,
  credentials: true
}));

app.use(authOptional);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/export', exportRouter);

// Serve PWA
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../../web/dist');
app.use(express.static(staticDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`STM server running on port ${PORT}`);
});
