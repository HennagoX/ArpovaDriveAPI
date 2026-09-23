import {Router} from 'express';

const router = Router()

router.get("./tQuestoesConcluidas", (req, res) => {
    console.log("Recebendo questões");
})

router.post("./concluirQuestao", (req, res) => {
   console.log("Concluindo questões")
})

export default router;