import {Router} from 'express';
import {checkQuestao} from '../controllers/questoes.controller.js'

const router = Router()

router.get("./tQuestoesConcluidas", (req, res) => {
    console.log("Recebendo questões");
})

router.post("./concluirQuestao", checkQuestao)

export default router;