import pool from './db.js';

/**
 * Repositório de Tarefas (PostgreSQL)
 * Gerencia todas as operações de persistência relacionadas às tarefas e usuários.
 */
export const taskRepository = {
  /**
   * Localiza um usuário pelo UUID, nome de usuário ou e-mail.
   * Retorna null caso o identificador não seja informado ou não conste na lista de usuários cadastrados.
   * @param {string} [identifier] 
   * @returns {Promise<Object|null>}
   */
  async findUser(identifier) {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return null;
    }

    const cleanId = identifier.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (isUuid) {
      const res = await pool.query(
        'SELECT id_usuario, nome, email, exp FROM usuario WHERE id_usuario = $1',
        [cleanId]
      );
      if (res.rows.length > 0) return res.rows[0];
    }

    const res = await pool.query(
      'SELECT id_usuario, nome, email, exp FROM usuario WHERE LOWER(nome) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1',
      [cleanId]
    );
    if (res.rows.length > 0) return res.rows[0];

    return null;
  },

  /**
   * Retorna a lista de usuários cadastrados no banco de dados.
   * @returns {Promise<Array>}
   */
  async listUsers() {
    const res = await pool.query(
      'SELECT id_usuario, nome, email, exp, criado_em FROM usuario ORDER BY nome ASC'
    );
    return res.rows;
  },

  /**
   * Busca todas as tarefas de um usuário para a semana de referência especificada.
   * Ordenadas cronologicamente por dia da semana e posição (sort).
   * @param {string} userId 
   * @param {string} inicioSemana - Data YYYY-MM-DD da segunda-feira de referência
   * @returns {Promise<Array>}
   */
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

  /**
   * Busca uma tarefa específica pelo ID.
   * @param {string} taskId 
   * @returns {Promise<Object|null>}
   */
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

  /**
   * Insere em lote as tarefas de uma semana para o usuário no PostgreSQL.
   * @param {Array<Object>} tasks 
   * @returns {Promise<Array>}
   */
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

  /**
   * Atualiza o status e/ou conclusão de uma tarefa.
   * @param {string} taskId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
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

  /**
   * Incrementa o XP do usuário na tabela usuario.
   * @param {string} userId 
   * @param {number} xpAmount 
   * @returns {Promise<number>} Novo total de XP
   */
  async updateUserXp(userId, xpAmount) {
    const query = `
      UPDATE usuario
      SET exp = COALESCE(exp, 0) + $2
      WHERE id_usuario = $1
      RETURNING exp;
    `;
    const res = await pool.query(query, [userId, xpAmount]);
    return res.rows[0]?.exp || 0;
  },

  /**
   * Remove todas as tarefas de uma determinada semana para o usuário (usado no reset de cronograma).
   * @param {string} userId 
   * @param {string} inicioSemana 
   * @returns {Promise<number>} Número de registros removidos
   */
  async deleteTasksByUserAndWeek(userId, inicioSemana) {
    const res = await pool.query(
      'DELETE FROM tarefa WHERE id_usuario = $1 AND inicio_semana = $2',
      [userId, inicioSemana]
    );
    return res.rowCount;
  }
};

export default taskRepository;
