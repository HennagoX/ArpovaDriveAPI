import pool from '../Repositories/db.js';

export async function getCurrentXp(userId) {
  const result = await pool.query(
    'SELECT exp FROM usuario WHERE id_usuario = $1',
    [userId]
  );
  return Number(result.rows[0]?.exp || 0);
}

export async function incrementXp(userId, increment = 0) {
  const result = await pool.query(
    'UPDATE usuario SET exp = COALESCE(exp, 0) + $1 WHERE id_usuario = $2 RETURNING exp',
    [increment, userId]
  );
  return Number(result.rows[0]?.exp || 0);
}