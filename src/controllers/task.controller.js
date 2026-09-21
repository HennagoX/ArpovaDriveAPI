import taskService from '../services/task.service.js';
import { isUserAdmin } from '../config/admin.config.js';

/**
 * Utilitário para extração padronizada de parâmetros da requisição.
 * Evita colisões e suporta IDs passados via params, body ou query.
 * Identifica também se o solicitante possui permissão de Administrador.
 * @param {import('express').Request} req 
 */
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
  
  // Suporte a simulação de dia / mock (ex: ?simularDia=quarta, ?mockDay=quarta, ?dia=3, headers['x-mock-day'], etc.)
  const rawDateOrDay = req.query?.simularDia || req.query?.mockDay || req.query?.dia || req.body?.simularDia || req.body?.mockDay || req.body?.dia || req.headers?.['x-mock-day'] || req.query?.date || req.body?.date || req.headers?.['x-mock-date'];

  const date = taskService.resolveReferenceDate(rawDateOrDay);

  return { taskId, userId, requesterId, isAdmin, date, rawDateOrDay };
}

/**
 * GET /task/admin-check
 * Retorna se o usuário que fez a requisição é o Administrador do sistema.
 */
export function verificarAdmin(req, res) {
  const { requesterId, isAdmin } = extrairParametros(req);
  return res.status(200).json({
    isAdmin,
    requesterId
  });
}

/**
 * GET /task/usuarios
 * Retorna todos os usuários cadastrados.
 * RESTRITO: Apenas o Administrador pode listar usuários.
 */
export async function listarUsuarios(req, res, next) {
  try {
    const { isAdmin } = extrairParametros(req);
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

/**
 * GET /task ou /task/tasks
 * Retorna o payload completo do cronograma semanal e a tarefa atual.
 */
export async function listar(req, res, next) {
  try {
    const { userId, requesterId, isAdmin, rawDateOrDay, date } = extrairParametros(req);

    // Se solicitou simulação de dia e não for admin, bloqueia
    if (rawDateOrDay && !isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado. Apenas o administrador tem permissão para simular dias da semana.'
      });
    }

    // Usuário comum só pode acessar suas próprias tarefas
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

/**
 * GET /task/:id ou /task/tasks/:id
 * Retorna os detalhes de uma tarefa específica por ID.
 */
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

/**
 * POST /task/:id/iniciar ou /task/iniciar
 * Inicia uma tarefa (status vira 'in_progress').
 */
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

/**
 * POST /task/:id/concluir ou /task/concluir
 * Conclui uma tarefa, concede XP ao usuário e atualiza os status das próximas tarefas do dia.
 */
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
    const result = await taskService.completeTask(taskId, userId, date);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /task/:id/pausar ou /task/pausar
 * Pausa uma tarefa que está em andamento (volta para 'current').
 */
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

/**
 * POST /task/:id/reiniciar ou /task/reiniciar
 * Reinicia o status de uma tarefa.
 */
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

/**
 * POST /task/reset-schedule
 * Limpa e reinicializa todo o cronograma da semana do usuário no PostgreSQL.
 * RESTRITO: Apenas o Administrador pode resetar cronogramas.
 */
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

// Aliases para compatibilidade retroativa
export const reqTasks = listar;
export const startTask = iniciar;
export const completeTask = concluir;
export const pauseTask = pausar;
export const resetTask = reiniciar;
export const resetSchedule = resetarCronograma;