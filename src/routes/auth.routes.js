import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { loginSchema, userSchema } from '../schemas/auth.schema.js';
import { login, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(userSchema), register);

export default router;
