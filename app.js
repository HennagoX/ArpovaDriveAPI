import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';

import path from 'path';
import authRoutes from './src/routes/auth.routes.js';
import taskRoutes from './src/routes/task.routes.js';
import questoesRoutes from './src/routes/questoes.routes.js';
import moduloRoutes from './src/routes/modulo.router.js';
import aiRoutes from './src/routes/ai.routes.js';
import desempenhoRoutes from './src/routes/desempenho.routes.js';
import moduloCustomizadoRoutes from './src/routes/moduloCustomizado.routes.js';

import { corsOptions } from './src/config/cors.js';
import { rateLimiters } from './src/config/rateLimit.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import taskService from './src/services/task.service.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Servir arquivos estáticos de uploads de PDFs
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/auth', authRoutes);
app.use('/task', taskRoutes);
app.use('/questoes', questoesRoutes);
app.use('/modulo', moduloRoutes);
app.use('/ai', aiRoutes);
app.use('/desempenho', desempenhoRoutes);
app.use('/modulos-customizados', moduloCustomizadoRoutes);
app.use('/api/modulos-customizados', moduloCustomizadoRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'AprovaDrive API' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, (err) => {
  if (err){
    console.error(err);
    return;
  }
  console.log('App listening on port ' + PORT);
});

export default app;