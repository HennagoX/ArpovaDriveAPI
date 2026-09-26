import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import session from 'express-session'
import cors from 'cors';

import authRoutes from './src/routes/auth.routes.js';
import taskRoutes from './src/routes/task.routes.js';
import questoesRoutes from './src/routes/questoes.routes.js';
import moduloRoutes from './src/routes/modulo.router.js';
import aiRoutes from './src/routes/ai.routes.js';

import { corsOptions } from './src/config/cors.js';
import { rateLimiters } from './src/config/rateLimit.js';
import { errorHandler, notFoundHandler } from './src/middlewares/errorHandler.js';
import taskService from './src/services/task.service.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors(corsOptions));
app.use(express.json());

app.use(session({
  secret: '',
  resave : false,
  saveUninitialized: true,
  cookie: {secure: false, maxAge: 1000 * 60 * 30}
}))

app.use('/auth', authRoutes);
app.use('/task', taskRoutes);
app.use('/questoes', questoesRoutes);
app.use('/modulo', moduloRoutes);
app.use('/ai', aiRoutes);

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