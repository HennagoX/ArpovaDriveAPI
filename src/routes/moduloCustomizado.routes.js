import { Router } from 'express';
import { listar, salvar, remover, restaurar, historico, reverter } from '../controllers/moduloCustomizado.controller.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Histórico de alterações e reversão (deve vir antes de /:conteudoId para evitar colisão de rota)
router.get('/historico', requireAdmin, historico);
router.post('/historico/:id/reverter', requireAdmin, reverter);

// Rota pública de leitura: alunos e admins precisam ver os módulos e PDFs atualizados
router.get('/', listar);
router.get('/:conteudoId', listar);

// Rotas administrativas protegidas com requireAdmin
router.post('/', requireAdmin, salvar);
router.delete('/:id', requireAdmin, remover);
router.post('/:id/restaurar', requireAdmin, restaurar);

export default router;
