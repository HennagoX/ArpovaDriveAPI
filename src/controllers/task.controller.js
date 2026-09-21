import taskService from '../services/task.service.js';

/**
 * Utilitário para extração padronizada de parâmetros da requisição.
 * Evita colisões e suporta IDs passados via params, body ou query.
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
                 req.headers?.['x-user-id'] || 
                 req.headers?.['x-usuario-id'] || 
                 (!req.params?.id ? req.query?.id : null);
  
  // Suporte a simulação de dia / mock (ex: ?simularDia=quarta, ?mockDay=quarta, ?dia=3, headers['x-mock-day'], etc.)
  const rawDateOrDay = req.query?.simularDia || req.query?.mockDay || req.query?.dia || req.body?.simularDia || req.body?.mockDay || req.body?.dia || req.headers?.['x-mock-day'] || req.query?.date || req.body?.date || req.headers?.['x-mock-date'];

  const date = taskService.resolveReferenceDate(rawDateOrDay);

  return { taskId, userId, date, rawDateOrDay };
}

/**
 * GET /task/usuarios
 * Retorna todos os usuários cadastrados para permitir seleção e validação no front-end.
 */
export async function listarUsuarios(req, res, next) {
  try {
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
    const { userId, date } = extrairParametros(req);
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
    const { taskId, userId, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para iniciar.' });
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
    const { taskId, userId, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para concluir.' });
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
    const { taskId, userId, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para pausar.' });
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
    const { taskId, userId, date } = extrairParametros(req);
    if (!taskId) {
      return res.status(400).json({ error: 'ID da tarefa é obrigatório para reiniciar.' });
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
 */
export async function resetarCronograma(req, res, next) {
  try {
    const { userId, date } = extrairParametros(req);
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