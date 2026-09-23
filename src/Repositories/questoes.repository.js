import pool from './db.js';

export async function getQuestoes(moduloQuestao, userId) {
  if (moduloQuestao) {
    const response = await pool.query(
      `SELECT ${moduloQuestao} FROM usuario WHERE id_usuario = $1`,
      [userId]
    );
    return response.rows[0] || null;
  }

  const response = await pool.query(
    'SELECT acertos_codigotransito, acertos_placatransito, acertos_direcaodefensiva, acertos_primeirossocorros, acertos_meioambiente FROM usuario WHERE id_usuario = $1',
    [userId]
  );
  return response.rows[0] || null;
}

export async function incrementarAcerto(moduloQuestao, userId) {
  const response = await pool.query(
    `UPDATE usuario SET ${moduloQuestao} = COALESCE(${moduloQuestao}, 0) + 1 WHERE id_usuario = $1 RETURNING ${moduloQuestao}`,
    [userId]
  );
  return response.rows[0]?.[moduloQuestao] ?? null;
}