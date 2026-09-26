import { Router } from 'express';
import { getDesempenho } from '../controllers/desempenho.controller.js';

const router = Router();

router.get('/', getDesempenho);
router.get('/:userId', getDesempenho);

export default router;
