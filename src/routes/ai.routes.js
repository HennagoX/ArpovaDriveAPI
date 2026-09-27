import { Router } from "express";
import { chatWithAi, sugerirTarefasController } from "../controllers/ai.controller.js";

const router = Router();

router.post("/chat", chatWithAi);
router.get("/sugerir-tarefas", sugerirTarefasController);
router.post("/sugerir-tarefas", sugerirTarefasController);

export default router;
