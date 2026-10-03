import { Router } from 'express';
import { listar, salvar, remover, restaurar, historico, reverter, removerHistorico, limparHistorico } from '../controllers/moduloCustomizado.controller.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

router.get('/historico', requireAdmin, historico);
router.post('/historico/:id/reverter', requireAdmin, reverter);
router.delete('/historico/:id', requireAdmin, removerHistorico);
router.delete('/historico', requireAdmin, limparHistorico);

router.get('/', listar);
router.get('/:conteudoId', listar);

router.post('/', requireAdmin, salvar);
router.delete('/:id', requireAdmin, remover);
router.post('/:id/restaurar', requireAdmin, restaurar);

export default router;
