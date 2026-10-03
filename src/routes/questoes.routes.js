import { Router } from 'express';
import {
  checkQuestao,
  checkAcerto,
  getQuestoesConcluidas,
  getPerguntas,
  getBaterias,
  concluirBateriaController,
  verificarAcessoBateriaController,
  getSimuladoQuestoesController,
  concluirSimuladoController,
  getSimuladoResultadosController,
  adminCriarQuestao,
  adminListarQuestoes,
  adminRemoverQuestao,
  adminCriarSimulado,
  adminListarSimulados,
  adminRemoverSimulado
} from '../controllers/questoes.controller.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

router.get('/concluidas', getQuestoesConcluidas);
router.get('/tQuestoesConcluidas', getQuestoesConcluidas);
router.get('/perguntas', getPerguntas);
router.get('/baterias', getBaterias);
router.get('/verificarAcesso', verificarAcessoBateriaController);
router.get('/simulado', getSimuladoQuestoesController);
router.get('/simulado/resultados', getSimuladoResultadosController);
router.post('/concluirQuestao', checkQuestao);
router.post('/checkQuestao', checkQuestao);
router.post('/checkAcerto', checkAcerto);
router.post('/concluirBateria', concluirBateriaController);
router.post('/simulado/concluir', concluirSimuladoController);

router.get('/customizadas', adminListarQuestoes);
router.post('/admin/criar', requireAdmin, adminCriarQuestao);
router.put('/admin/:id', requireAdmin, adminCriarQuestao);
router.delete('/admin/:id', requireAdmin, adminRemoverQuestao);

router.get('/simulados-customizados', adminListarSimulados);
router.post('/simulados-customizados/admin/criar', requireAdmin, adminCriarSimulado);
router.delete('/simulados-customizados/admin/:id', requireAdmin, adminRemoverSimulado);

export default router;