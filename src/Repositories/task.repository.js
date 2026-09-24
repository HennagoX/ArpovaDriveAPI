import pool from './db.js';
import { incrementXp } from '../services/exp.service.js';

export const taskRepository = {
  async findUser(identifier) {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return null;
    }

    const cleanId = identifier.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (isUuid) {
      const res = await pool.query(
        'SELECT id_usuario, nome, email, exp, lv FROM usuario WHERE id_usuario = $1',
        [cleanId]
      );
      if (res.rows.length > 0) return res.rows[0];
    }

    const res = await pool.query(
      'SELECT id_usuario, nome, email, exp, lv FROM usuario WHERE LOWER(nome) = LOWER($1) OR LOWER(email) = LOWER($1) OR LOWER(nome) LIKE LOWER($1) || \'%\' LIMIT 1',
      [cleanId]
    );
    if (res.rows.length > 0) return res.rows[0];

    const defaultUser = await pool.query("SELECT id_usuario, nome, email, exp, lv FROM usuario WHERE LOWER(nome) LIKE '%henrique%' OR LOWER(email) LIKE '%henrique%' LIMIT 1");
    if (defaultUser.rows.length > 0) return defaultUser.rows[0];
    const firstUser = await pool.query('SELECT id_usuario, nome, email, exp, lv FROM usuario LIMIT 1');
    return firstUser.rows[0] || null;
  },

  async listUsers() {
    const res = await pool.query(
      'SELECT id_usuario, nome, email, exp, criado_em FROM usuario ORDER BY nome ASC'
    );
    return res.rows;
  },

  async getTasksByUserAndWeek(userId, inicioSemana) {
    const query = `
      SELECT 
        id, 
        id_usuario, 
        titulo, 
        descricao, 
        xp_reward, 
        status, 
        concluida, 
        sort, 
        dia_semana, 
        horario, 
        duracao, 
        data_agendada, 
        inicio_semana
      FROM tarefa
      WHERE id_usuario = $1 AND inicio_semana = $2
      ORDER BY dia_semana ASC, sort ASC;
    `;
    const res = await pool.query(query, [userId, inicioSemana]);
    return res.rows;
  },

  async getTaskById(taskId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);
    if (!isUuid) {
      return null;
    }

    const query = `
      SELECT 
        id, 
        id_usuario, 
        titulo, 
        descricao, 
        xp_reward, 
        status, 
        concluida, 
        sort, 
        dia_semana, 
        horario, 
        duracao, 
        data_agendada, 
        inicio_semana
      FROM tarefa
      WHERE id = $1;
    `;
    const res = await pool.query(query, [taskId]);
    return res.rows[0] || null;
  },

  async insertWeeklyTasks(tasks) {
    if (!tasks || tasks.length === 0) return [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertedRows = [];

      const query = `
        INSERT INTO tarefa (
          id_usuario,
          titulo,
          descricao,
          xp_reward,
          status,
          concluida,
          sort,
          dia_semana,
          horario,
          duracao,
          data_agendada,
          inicio_semana
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;

      for (const t of tasks) {
        const res = await client.query(query, [
          t.id_usuario,
          t.titulo,
          t.descricao,
          t.xp_reward,
          t.status || 'pending',
          Boolean(t.concluida),
          t.sort,
          t.dia_semana,
          t.horario,
          t.duracao,
          t.data_agendada,
          t.inicio_semana
        ]);
        insertedRows.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return insertedRows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateTask(taskId, updates = {}) {
    const fields = [];
    const values = [taskId];
    let idx = 2;

    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.concluida !== undefined) {
      fields.push(`concluida = $${idx++}`);
      values.push(Boolean(updates.concluida));
    }

    fields.push(`atualizado_em = NOW()`);

    const query = `
      UPDATE tarefa
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;

    const res = await pool.query(query, values);
    return res.rows[0] || null;
  },

  async updateUserXp(userId, xpAmount) {
    const res = await incrementXp(userId, xpAmount);
    return res.exp;
  },

  async deleteTasksByUserAndWeek(userId, inicioSemana) {
    const res = await pool.query(
      'DELETE FROM tarefa WHERE id_usuario = $1 AND inicio_semana = $2',
      [userId, inicioSemana]
    );
    return res.rowCount;
  }
};

export default taskRepository;
