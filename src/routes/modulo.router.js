import { Router } from "express";
import { getCurrentModule, moveToNextModule, setModulePointer } from "../controllers/modulo.controller.js";

const router = Router();

router.get("/get", getCurrentModule);
router.get("/:id", getCurrentModule);
router.get("/", getCurrentModule);

router.post("/next", moveToNextModule);
router.post("/:id/next", moveToNextModule);

router.post("/set", setModulePointer);
router.post("/:id/set", setModulePointer);

router.post("/:id", moveToNextModule);
router.post("/", moveToNextModule);

export default router;