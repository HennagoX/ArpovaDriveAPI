import express from 'express';
import cron from 'node-cron';
import taskService from './src/services/task.service.js';
import tasksSemanaisModel from './src/models/tasksSemanais.js'
import cors from 'cors';

import authRoutes from './src/routes/auth.routes.js';
import { corsOptions } from './src/config/cors.js';
import { rateLimiters } from './src/config/rateLimit.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import Task from './src/models/task.js';

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

/*
app.listen(PORT, () => {
  console.log('app listening on port ' + PORT);
});
*/

const task = new Task(1, "Capítulo 1 matemática", 30, "Estudar capítulo 1 de matemática em conteúdos", true, undefined, 1);
const taskSemanal = new tasksSemanaisModel(task.id, new Date("2026-09-7"), 1, 1, false);
