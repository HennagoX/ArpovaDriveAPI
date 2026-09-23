import pool from './db.js';

export async function getCurrentModuloDB(content, userId) {
  const result = await pool.query(
    `SELECT ${content} FROM usuario WHERE id_usuario = $1`,
    [userId]
  );
  return result;
}

export async function nextCurrentModuloDB(content, userId) {
  const result = await pool.query(
    `UPDATE usuario SET ${content} = COALESCE(${content}, 0) + 1 WHERE id_usuario = $1 RETURNING ${content}`,
    [userId]
  );
  return result;
}