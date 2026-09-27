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

  async ensureTaskTableColumns() {
    try {
      await pool.query(`
        ALTER TABLE tarefa 
          ADD COLUMN IF NOT EXISTS tipo_validacao VARCHAR(50),
          ADD COLUMN IF NOT EXISTS parametros_validacao JSONB,
          ADD COLUMN IF NOT EXISTS validada BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS motivo_bloqueio TEXT;
      `);
    } catch (err) {
      console.warn('[TaskRepository] Erro ao assegurar colunas da tabela tarefa:', err.message);
    }
  },

  async getTasksByUserAndWeek(userId, inicioSemana) {
    await this.ensureTaskTableColumns();
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
        inicio_semana,
        tipo_validacao,
        parametros_validacao,
        validada,
        motivo_bloqueio
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

    await this.ensureTaskTableColumns();
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
        inicio_semana,
        tipo_validacao,
        parametros_validacao,
        validada,
        motivo_bloqueio
      FROM tarefa
      WHERE id = $1;
    `;
    const res = await pool.query(query, [taskId]);
    return res.rows[0] || null;
  },

  async insertWeeklyTasks(tasks) {
    if (!tasks || tasks.length === 0) return [];
    await this.ensureTaskTableColumns();

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
          inicio_semana,
          tipo_validacao,
          parametros_validacao,
          validada,
          motivo_bloqueio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
          t.inicio_semana,
          t.tipo_validacao || null,
          t.parametros_validacao ? JSON.stringify(t.parametros_validacao) : null,
          Boolean(t.validada),
          t.motivo_bloqueio || null
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

  async createTask(t) {
    await this.ensureTaskTableColumns();
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
        inicio_semana,
        tipo_validacao,
        parametros_validacao,
        validada,
        motivo_bloqueio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;

    const res = await pool.query(query, [
      t.id_usuario,
      t.titulo,
      t.descricao || '',
      Number(t.xp_reward || 30),
      t.status || 'pending',
      Boolean(t.concluida),
      Number(t.sort || 1),
      Number(t.dia_semana || 1),
      t.horario || '14:00',
      t.duracao || '25 min',
      t.data_agendada,
      t.inicio_semana,
      t.tipo_validacao || 'bateria',
      t.parametros_validacao ? JSON.stringify(t.parametros_validacao) : null,
      Boolean(t.validada),
      t.motivo_bloqueio || null
    ]);

    return res.rows[0];
  },

  async updateTask(taskId, updates = {}) {
    await this.ensureTaskTableColumns();
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
    if (updates.validada !== undefined) {
      fields.push(`validada = $${idx++}`);
      values.push(Boolean(updates.validada));
    }
    if (updates.motivo_bloqueio !== undefined) {
      fields.push(`motivo_bloqueio = $${idx++}`);
      values.push(updates.motivo_bloqueio);
    }
    if (updates.tipo_validacao !== undefined) {
      fields.push(`tipo_validacao = $${idx++}`);
      values.push(updates.tipo_validacao);
    }
    if (updates.parametros_validacao !== undefined) {
      fields.push(`parametros_validacao = $${idx++}`);
      values.push(updates.parametros_validacao ? JSON.stringify(updates.parametros_validacao) : null);
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
  },

  async deleteUncompletedTasksByUserAndWeek(userId, inicioSemana) {
    const res = await pool.query(
      'DELETE FROM tarefa WHERE id_usuario = $1 AND inicio_semana = $2 AND concluida = FALSE AND status != \'done\'',
      [userId, inicioSemana]
    );
    return res.rowCount;
  },

  async getUserProgresso(userId) {
    const res = await pool.query(
      `SELECT 
        id_usuario, 
        nome, 
        email, 
        exp, 
        lv,
        COALESCE(modulo_codigotransito, 1) AS modulo_codigotransito,
        COALESCE(modulo_placastransito, 1) AS modulo_placastransito,
        COALESCE(modulo_direcaodefensiva, 1) AS modulo_direcaodefensiva,
        COALESCE(modulo_primeirossocorros, 1) AS modulo_primeirossocorros,
        COALESCE(modulo_cidadania, 1) AS modulo_cidadania,
        COALESCE(acertos_codigotransito, 0) AS acertos_codigotransito,
        COALESCE(acertos_placatransito, 0) AS acertos_placatransito,
        COALESCE(acertos_direcaodefensiva, 0) AS acertos_direcaodefensiva,
        COALESCE(acertos_primeirossocorros, 0) AS acertos_primeirossocorros,
        COALESCE(acertos_meioambiente, 0) AS acertos_meioambiente
      FROM usuario 
      WHERE id_usuario = $1`,
      [userId]
    );
    return res.rows[0] || null;
  },

  async getUserBaterias(userId) {
    const res = await pool.query(
      `SELECT materia, bateria, acertos, total_questoes, porcentagem, aprovado, atualizado_em
       FROM bateria_resultado 
       WHERE id_usuario = $1
       ORDER BY atualizado_em DESC`,
      [userId]
    );
    return res.rows;
  },

  async getUserSimulados(userId) {
    const res = await pool.query(
      `SELECT id_simulado, materia, acertos, total_questoes, porcentagem, aprovado, tempo_gasto_segundos, criado_em
       FROM simulado_resultado 
       WHERE id_usuario = $1
       ORDER BY criado_em DESC`,
      [userId]
    );
    return res.rows;
  }
};

export default taskRepository;

