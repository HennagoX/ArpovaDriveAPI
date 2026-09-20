import express from 'express';
import cron from 'node-cron';
import taskService, {getCurrentWeekDays} from './src/services/task.service.js';
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


// TAREFAS DO HENRIQUE
const estudarCap1_h = taskService.newTaskFromTemplate("Henrique", 'codigoTransitoCapitulo1')
const estudarCap2_h = taskService.newTaskFromTemplate("Henrique", 'codigoTransitoCapitulo2')
const estudarCap3_h = taskService.newTaskFromTemplate("Henrique", 'placasTransitoCapitulo1')
taskService.setDailyTask(estudarCap1_h);
taskService.setDailyTask(estudarCap2_h);
taskService.setDailyTask(estudarCap3_h);


// TAREFAS DO PEDRO
const estudarCap1_p = taskService.newTaskFromTemplate("Pedro", 'codigoTransitoCapitulo1')
const estudarCap2_p = taskService.newTaskFromTemplate("Pedro", 'codigoTransitoCapitulo2')
const estudarCap3_p = taskService.newTaskFromTemplate("Pedro", 'placasTransitoCapitulo1')
taskService.setDailyTask(estudarCap1_p);
taskService.setDailyTask(estudarCap2_p);
taskService.setDailyTask(estudarCap3_p);

taskService.getDailyTasks().forEach((task) => {
  console.log(JSON.stringify(task, null, 2)); 
  console.log("\n-------------------\n"); 
});
