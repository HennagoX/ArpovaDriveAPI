import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { loginSchema, userSchema, perguntaSegurancaSchema, verificarRespostaSchema, redefinirSenhaSchema } from '../schemas/auth.schema.js';
import { login, register, getPerguntaSeguranca, verificarRespostaSeguranca, redefinirSenha } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(userSchema), register);
router.post('/pergunta-seguranca', validate(perguntaSegurancaSchema), getPerguntaSeguranca);
router.get('/pergunta-seguranca', getPerguntaSeguranca);
router.post('/verificar-resposta', validate(verificarRespostaSchema), verificarRespostaSeguranca);
router.post('/redefinir-senha', validate(redefinirSenhaSchema), redefinirSenha);

export default router;
