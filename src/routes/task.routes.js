import express, { Router } from 'express';
import { validate } from '../middlewares/validate.js';
//import { loginSchema, userSchema } from '../schemas/auth.schema.js';
import { reqTasks } from '../controllers/task.controller.js';

const router = Router()

router.get('/tasks', reqTasks);

export default router;