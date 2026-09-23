import { Router } from "express";
import { getCurrentModule, moveToNextModule } from "../controllers/modulo.controller.js";

const router = Router();

router.get("/get", getCurrentModule);
router.get("/", getCurrentModule);
router.post("/next", moveToNextModule);
router.post("/", moveToNextModule);

export default router;