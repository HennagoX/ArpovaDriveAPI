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
  getSimuladoResultadosController
} from '../controllers/questoes.controller.js';

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

export default router;