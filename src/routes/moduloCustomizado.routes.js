import { Router } from 'express';
import { listar, salvar, remover, restaurar, historico, reverter, removerHistorico, limparHistorico } from '../controllers/moduloCustomizado.controller.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Histórico de alterações, reversão e exclusão (deve vir antes de /:conteudoId para evitar colisão de rota)
router.get('/historico', requireAdmin, historico);
router.post('/historico/:id/reverter', requireAdmin, reverter);
router.delete('/historico/:id', requireAdmin, removerHistorico);
router.delete('/historico', requireAdmin, limparHistorico);

// Rota pública de leitura: alunos e admins precisam ver os módulos e PDFs atualizados
router.get('/', listar);
router.get('/:conteudoId', listar);

// Rotas administrativas protegidas com requireAdmin
router.post('/', requireAdmin, salvar);
router.delete('/:id', requireAdmin, remover);
router.post('/:id/restaurar', requireAdmin, restaurar);

export default router;
