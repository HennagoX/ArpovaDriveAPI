import taskService from '../services/task.service.js';
import { isUserAdmin } from '../config/admin.config.js';
import { checkIsAdmin } from '../middlewares/admin.middleware.js';

export function extrairParametros(req) {
  const taskId = req.params?.id || req.body?.taskId || req.body?.id || req.body?.id_tarefa || req.query?.taskId;
  const userId = req.body?.id_usuario || 
                 req.body?.userId || 
                 req.body?.usuario || 
                 req.query?.userId || 
                 req.query?.id_usuario || 
                 req.query?.usuario || 
                 (!req.params?.id ? req.query?.id : null);

  const requesterId = req.headers?.['x-admin-id'] || 
                      req.headers?.['x-user-id'] || 
                      req.headers?.['x-usuario-id'] || 
                      req.body?.requesterId || 
                      req.query?.requesterId || 
                      userId;

  const isAdmin = isUserAdmin(requesterId);
  
  const rawDateOrDay = req.query?.simularDia || req.query?.mockDay || req.query?.dia || req.body?.simularDia || req.body?.mockDay || req.body?.dia || req.headers?.['x-mock-day'] || req.query?.date || req.body?.date || req.headers?.['x-mock-date'];

  const date = taskService.resolveReferenceDate(rawDateOrDay);

  return { taskId, userId, requesterId, isAdmin, date, rawDateOrDay };
}

export async function verificarAdmin(req, res) {
  const { requesterId } = extrairParametros(req);
  const isAdmin = await checkIsAdmin(requesterId);
  return res.status(200).json({
    isAdmin,
    requesterId
  });
}

export async function listarUsuarios(req, res, next) {
  try {
    const { requesterId } = extrairParametros(req);
    const isAdmin = await checkIsAdmin(requesterId);
    if (!isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas o administrador tem permissão para listar todos os usuários.'
      });
    }

    const usuarios = await taskService.listarUsuarios();
    return res.status(200).json({ success: true, usuarios });
  } catch (error) {
    next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const { userId, requesterId, isAdmin, rawDateOrDay, date } = extrairParametros(req);
console.log(isAdmin)
    if (rawDateOrDay && !isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas o administrador tem permissão para simular dias da semana.'
      });
    }

    if (!isAdmin && requesterId && userId && requesterId !== userId) {
      return res.status(403).json({
        error: 'Acesso negado. Você só tem permissão para acessar suas próprias tarefas.'
      });
    }

    const payload = await taskService.getUserTaskPayload(userId, date);
    return res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const { taskId } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório.' });
    }
    const task = await taskService.getTaskById(taskId);
    return res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
}

export async function iniciar(req, res, next) {
  try {
    const { taskId, userId, requesterId, isAdmin, rawDateOrDay, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para iniciar.' });
    }
    if (rawDateOrDay && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas o administrador pode simular dias da semana.' });
    }
    if (!isAdmin && requesterId && userId && requesterId !== userId) {
      return res.status(403).json({ error: 'Acesso negado. Você só tem permissão para gerenciar suas próprias tarefas.' });
    }
    const result = await taskService.startTask(taskId, userId, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function concluir(req, res, next) {
  try {
    const { taskId, userId, requesterId, isAdmin, rawDateOrDay, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para concluir.' });
    }
    if (rawDateOrDay && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas o administrador pode simular dias da semana.' });
    }
    if (!isAdmin && requesterId && userId && requesterId !== userId) {
      return res.status(403).json({ error: 'Acesso negado. Você só tem permissão para gerenciar suas próprias tarefas.' });
    }
    const isForce = Boolean(req.body?.force && isAdmin);
    const result = await taskService.completeTask(taskId, userId, date, { force: isForce });
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 400 || error.validacao) {
      return res.status(400).json({
        error: error.message,
        validacao: error.validacao || null
      });
    }
    next(error);
  }
}

export async function pausar(req, res, next) {
  try {
    const { taskId, userId, requesterId, isAdmin, rawDateOrDay, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para pausar.' });
    }
    if (rawDateOrDay && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas o administrador pode simular dias da semana.' });
    }
    if (!isAdmin && requesterId && userId && requesterId !== userId) {
      return res.status(403).json({ error: 'Acesso negado. Você só tem permissão para gerenciar suas próprias tarefas.' });
    }
    const result = await taskService.pauseTask(taskId, userId, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function reiniciar(req, res, next) {
  try {
    const { taskId, userId, requesterId, isAdmin, rawDateOrDay, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para reiniciar.' });
    }
    if (rawDateOrDay && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas o administrador pode simular dias da semana.' });
    }
    if (!isAdmin && requesterId && userId && requesterId !== userId) {
      return res.status(403).json({ error: 'Acesso negado. Você só tem permissão para gerenciar suas próprias tarefas.' });
    }
    const result = await taskService.resetTask(taskId, userId, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetarCronograma(req, res, next) {
  try {
    const { userId, isAdmin, date } = extrairParametros(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas o administrador pode reinicializar cronogramas.' });
    }
    const result = await taskService.resetSchedule(userId, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function regenerarComIA(req, res, next) {
  try {
    const { userId, requesterId, isAdmin, date } = extrairParametros(req);
    if (!isAdmin && requesterId && userId && requesterId !== userId) {
      return res.status(403).json({ error: 'Acesso negado. Você só tem permissão para gerenciar suas próprias tarefas.' });
    }
    const result = await taskService.regenerarTarefasComIA(userId, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export const reqTasks = listar;
export const startTask = iniciar;
export const completeTask = concluir;
export const pauseTask = pausar;
export const resetTask = reiniciar;
export const resetSchedule = resetarCronograma;
export const regenerarTarefasIA = regenerarComIA;