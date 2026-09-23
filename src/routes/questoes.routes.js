import { Router } from 'express';
import { checkQuestao, checkAcerto, getQuestoesConcluidas } from '../controllers/questoes.controller.js';

const router = Router();

router.get("/tQuestoesConcluidas", getQuestoesConcluidas);
router.get("/concluidas", getQuestoesConcluidas);
router.post("/concluirQuestao", checkQuestao);
router.post("/checkQuestao", checkQuestao);
router.post("/checkAcerto", checkAcerto);

export default router;