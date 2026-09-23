import { Router } from "express";
import { getCurrentModule, moveToNextModule } from "../controllers/modulo.controller.js";

const router = Router()

router.get("/get", getCurrentModule)
router.post("/next", moveToNextModule)

export default router