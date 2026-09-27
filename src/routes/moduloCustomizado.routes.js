import { Router } from 'express';
import { listar, salvar, remover, restaurar } from '../controllers/moduloCustomizado.controller.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Rota pública de leitura: alunos e admins precisam ver os módulos e PDFs atualizados
router.get('/', listar);
router.get('/:conteudoId', listar);

// Rotas administrativas protegidas com requireAdmin
router.post('/', requireAdmin, salvar);
router.delete('/:id', requireAdmin, remover);
router.post('/:id/restaurar', requireAdmin, restaurar);

export default router;
