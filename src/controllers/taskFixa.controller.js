import taskFixaService from '../services/taskFixa.service.js';
import { getTaskById } from '../config/tarefasFixas.config.js';

export function extrairIdentificadorUsuario(req) {
  return (
    req.body?.id_usuario ||
    req.body?.userId ||
    req.body?.usuario ||
    req.query?.userId ||
    req.query?.id_usuario ||
    req.query?.usuario ||
    req.query?.id ||
    req.headers?.['x-user-id'] ||
    req.headers?.['x-usuario-id'] ||
    'henrique'
  );
}

export async function listarFixas(req, res, next) {
  try {
    const userId = extrairIdentificadorUsuario(req);
    const payload = await taskFixaService.getFixedTasksPayload(userId);
    return res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}

export async function buscarFixaPorId(req, res, next) {
  try {
    const taskId = req.params?.id || req.query?.taskId;
    if (!taskId) {
      return res.status(400).json({ success: false, error: 'ID da tarefa é obrigatório.' });
    }
    const task = getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Tarefa não encontrada.' });
    }
    return res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
}

export async function concluirFixa(req, res, next) {
  try {
    const taskId = req.params?.id || req.body?.taskId || req.body?.id || req.body?.id_tarefa;
    if (!taskId) {
      return res.status(400).json({ success: false, error: 'ID da tarefa é obrigatório para concluir.' });
    }

    const userId = extrairIdentificadorUsuario(req);
    const result = await taskFixaService.concluirTarefaFixa(taskId, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    next(error);
  }
}

export default {
  listarFixas,
  buscarFixaPorId,
  concluirFixa
};
