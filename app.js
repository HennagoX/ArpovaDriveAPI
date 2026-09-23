import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/auth.routes.js';
import taskRoutes from './src/routes/task.routes.js';
import questoesRoutes from './src/routes/questoes.routes.js';

import { corsOptions } from './src/config/cors.js';
import { rateLimiters } from './src/config/rateLimit.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import taskService from './src/services/task.service.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/task', taskRoutes);
app.use('/questoes', questoesRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'AprovaDrive API' });
});

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor local na porta ${PORT}`));
}


/*
app.listen(PORT, () => {
  console.log('App listening on port ' + PORT);

});
*/

export default app;