import { Router } from 'express';
import {
  listar,
  listarUsuarios,
  verificarAdmin,
  buscarPorId,
  iniciar,
  concluir,
  pausar,
  reiniciar,
  resetarCronograma,
  regenerarComIA
} from '../controllers/task.controller.js';
import {
  listarFixas,
  buscarFixaPorId,
  concluirFixa,
  criarTarefaFixaAdminController,
  removerTarefaFixaAdminController
} from '../controllers/taskFixa.controller.js';

const router = Router();

router.get('/admin-check', verificarAdmin);
router.get('/usuarios', listarUsuarios);

router.post('/fixas/admin/criar', criarTarefaFixaAdminController);
router.post('/fixas/criar', criarTarefaFixaAdminController);
router.delete('/fixas/admin/:id', removerTarefaFixaAdminController);
router.delete('/fixas/:id', removerTarefaFixaAdminController);

router.get('/fixas', listarFixas);
router.get('/fixas/:id', buscarFixaPorId);
router.post('/fixas/:id/concluir', concluirFixa);
router.post('/fixas/concluir', concluirFixa);

router.get('/conteudos', listarFixas);
router.get('/conteudos/:id', buscarFixaPorId);
router.post('/conteudos/:id/concluir', concluirFixa);
router.post('/conteudos/concluir', concluirFixa);

router.get('/', listar);
router.get('/tasks', listar);
router.get('/tasks/:id', buscarPorId);
router.get('/:id', buscarPorId);

router.post('/iniciar', iniciar);
router.post('/:id/iniciar', iniciar);

router.post('/concluir', concluir);
router.post('/:id/concluir', concluir);

router.post('/pausar', pausar);
router.post('/:id/pausar', pausar);

router.post('/reiniciar', reiniciar);
router.post('/:id/reiniciar', reiniciar);

router.post('/reset-schedule', resetarCronograma);
router.post('/regenerar-ia', regenerarComIA);
router.post('/sugerir-ia', regenerarComIA);

export default router;