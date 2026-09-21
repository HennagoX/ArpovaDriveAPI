import pool from '../Repositories/db.js';
import taskService from '../services/task.service.js';

export async function reqTasks(req, res, next) {
  try {
    const id = req.query.id || req.query.userId || req.query.usuario || 'Henrique';
    const payload = taskService.getUserTaskPayload(id);
    return res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
}