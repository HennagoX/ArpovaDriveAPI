import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must contain at least 6 characters.')
});

export const userSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must contain at least 6 characters.'),
  birthDate: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Invalid birth date.'
  })
});
