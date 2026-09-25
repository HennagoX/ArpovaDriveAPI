import pool from './db.js';
import { resolveUserId } from './modulo.repository.js';

const COLUNAS_VALIDAS = new Set([
  'acertos_codigotransito',
  'acertos_placatransito',
  'acertos_direcaodefensiva',
  'acertos_primeirossocorros',
  'acertos_meioambiente'
]);

export async function getQuestoes(moduloQuestao, userId) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;

  if (moduloQuestao && COLUNAS_VALIDAS.has(moduloQuestao)) {
    const response = await pool.query(
      `SELECT ${moduloQuestao} FROM usuario WHERE id_usuario = $1`,
      [resolvedId]
    );
    return response.rows[0] || null;
  }

  const response = await pool.query(
    'SELECT acertos_codigotransito, acertos_placatransito, acertos_direcaodefensiva, acertos_primeirossocorros, acertos_meioambiente FROM usuario WHERE id_usuario = $1',
    [resolvedId]
  );
  return response.rows[0] || null;
}

export async function incrementarAcerto(moduloQuestao, userId, quantidade = 1) {
  const resolvedId = await resolveUserId(userId);
  if (!COLUNAS_VALIDAS.has(moduloQuestao) || !resolvedId) return null;
  const qtd = Math.max(1, Number(quantidade) || 1);
  const response = await pool.query(
    `UPDATE usuario SET ${moduloQuestao} = COALESCE(${moduloQuestao}, 0) + $1 WHERE id_usuario = $2 RETURNING ${moduloQuestao}`,
    [qtd, resolvedId]
  );
  return response.rows[0]?.[moduloQuestao] ?? null;
}