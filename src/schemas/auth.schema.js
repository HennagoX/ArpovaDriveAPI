import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Por favor, insira um e-mail válido.'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.')
});

export const userSchema = z.object({
  nome: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.email('Por favor, insira um e-mail válido.'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  data_nascimento: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Data de nascimento inválida.'
  })
});
