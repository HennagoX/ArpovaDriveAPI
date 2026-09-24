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
  resetarCronograma
} from '../controllers/task.controller.js';

const router = Router();

router.get('/admin-check', verificarAdmin);
router.get('/usuarios', listarUsuarios);
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

export default router;