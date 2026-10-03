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

import os from 'os';
import pool from './src/Repositories/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploads', express.static(path.join(os.tmpdir(), 'aprovadrive', 'uploads')));

app.get('/uploads/pdfs/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const { rows } = await pool.query(
      `SELECT pdf_base64, pdf_nome FROM modulo_customizado 
       WHERE pdf_url LIKE $1 OR pdf_nome = $2 OR pdf_url LIKE $3
       LIMIT 1`,
      [`%${filename}%`, filename, `%/${filename}`]
    );

    if (rows.length > 0 && rows[0].pdf_base64) {
      const cleanBase64 = rows[0].pdf_base64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(rows[0].pdf_nome || filename)}"`);
      return res.send(buffer);
    }
    return next();
  } catch (err) {
    console.warn('[UploadsFallback] Falha ao recuperar PDF do banco:', err.message);
    return next();
  }
});

app.use('/auth', authRoutes);
app.use('/task', taskRoutes);
app.use('/questoes', questoesRoutes);
app.use('/modulo', moduloRoutes);
app.use('/modulos', moduloRoutes);
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
});

export default app;