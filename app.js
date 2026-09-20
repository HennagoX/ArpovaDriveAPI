import express from 'express';
import cron from 'node-cron';
import { newTask } from './src/services/task.service.js';
import cors from 'cors';

import authRoutes from './src/routes/auth.routes.js';
import { corsOptions } from './src/config/cors.js';
import { rateLimiters } from './src/config/rateLimit.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use(express.json());

app.use(rateLimiters.general);
app.use('/auth', rateLimiters.auth, authRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'ArpovaDrive API' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('app listening on port ' + PORT);
});

const task = newTask("Henrique") || "";
console.log(task);
/*
TODO : Esse vai ser o final 
cron.schedule('0 0 * * 1-6', () => {
})
*/