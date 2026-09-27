import pool from './db.js';
import { incrementXp } from '../services/exp.service.js';

export const taskFixaRepository = {
  async resolveUser(identifier) {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      const defaultUser = await pool.query("SELECT id_usuario, nome, email, exp, lv FROM usuario WHERE LOWER(nome) LIKE '%henrique%' OR LOWER(email) LIKE '%henrique%' LIMIT 1");
      if (defaultUser.rows.length > 0) return defaultUser.rows[0];
      const firstUser = await pool.query('SELECT id_usuario, nome, email, exp, lv FROM usuario LIMIT 1');
      return firstUser.rows[0] || null;
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

  async getCompletedFixedTasks(userId) {
    const res = await pool.query(
      `SELECT task_id, conteudo_id, tipo, xp_ganho, concluida_em 
       FROM tarefa_fixa_concluida 
       WHERE id_usuario = $1 
       ORDER BY concluida_em ASC`,
      [userId]
    );
    return res.rows;
  },

  async isFixedTaskCompleted(userId, taskId) {
    const res = await pool.query(
      `SELECT 1 FROM tarefa_fixa_concluida WHERE id_usuario = $1 AND task_id = $2 LIMIT 1`,
      [userId, taskId]
    );
    return res.rows.length > 0;
  },

  async recordCompletedFixedTask(userId, taskId, conteudoId, tipo, xpReward) {
    const res = await pool.query(
      `INSERT INTO tarefa_fixa_concluida (id_usuario, task_id, conteudo_id, tipo, xp_ganho, concluida_em)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id_usuario, task_id) DO NOTHING
       RETURNING *;`,
      [userId, taskId, conteudoId, tipo, xpReward]
    );
    return res.rows[0] || null;
  },

  async incrementUserXp(userId, xpReward) {
    return await incrementXp(userId, xpReward);
  },

  async getUserBaterias(userId) {
    const res = await pool.query(
      `SELECT materia, bateria, acertos, total_questoes, porcentagem, aprovado, atualizado_em
       FROM bateria_resultado 
       WHERE id_usuario = $1`,
      [userId]
    );
    return res.rows;
  },

  async isBateriaAprovada(userId, materia, bateria, percentualAlvo = 70) {
    const res = await pool.query(
      `SELECT 1 FROM bateria_resultado 
       WHERE id_usuario = $1 
         AND LOWER(materia) = LOWER($2) 
         AND bateria = $3 
         AND (aprovado = TRUE OR porcentagem >= $4) 
       LIMIT 1`,
      [userId, materia, Number(bateria), Number(percentualAlvo)]
    );
    return res.rows.length > 0;
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
  },

  async isSimuladoAprovado(userId, materia = null, percentualAlvo = 67, acertosNecessarios = 20) {
    let query = `
      SELECT 1 FROM simulado_resultado 
      WHERE id_usuario = $1 
        AND (aprovado = TRUE OR porcentagem >= $2 OR acertos >= $3)
    `;
    const params = [userId, Number(percentualAlvo), Number(acertosNecessarios)];
    if (materia && materia !== 'todos' && materia !== 'Geral' && materia !== 'geral') {
      query += ` AND LOWER(materia) = LOWER($4)`;
      params.push(materia);
    }
    const res = await pool.query(query, params);
    return res.rows.length > 0;
  },

  async getCustomFixedTasks(conteudoId = null) {
    let query = 'SELECT * FROM tarefa_fixa_customizada WHERE removido = FALSE';
    const params = [];
    if (conteudoId) {
      query += ' AND LOWER(conteudo_id) = LOWER($1)';
      params.push(conteudoId);
    }
    query += ' ORDER BY modulo_numero ASC, criado_em ASC';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getCustomTaskById(id) {
    const res = await pool.query(
      'SELECT * FROM tarefa_fixa_customizada WHERE id = $1 AND removido = FALSE LIMIT 1',
      [id]
    );
    return res.rows[0] || null;
  },

  async createCustomFixedTask(data) {
    const { id, conteudo_id, tipo = 'modulo', modulo_numero, titulo, descricao, xp_reward = 150 } = data;
    const res = await pool.query(
      `INSERT INTO tarefa_fixa_customizada (id, conteudo_id, tipo, modulo_numero, titulo, descricao, xp_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [id, conteudo_id, tipo, modulo_numero, titulo, descricao, xp_reward]
    );
    return res.rows[0];
  },

  async deleteCustomFixedTask(id) {
    const res = await pool.query(
      'UPDATE tarefa_fixa_customizada SET removido = TRUE WHERE id = $1 RETURNING *;',
      [id]
    );
    return res.rows[0] || null;
  }
};

export default taskFixaRepository;
