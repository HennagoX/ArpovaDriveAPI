import pool from './db.js';

export async function resolveUserId(identifier) {
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    const defaultUser = await pool.query("SELECT id_usuario FROM usuario WHERE LOWER(nome) = 'henrique' LIMIT 1");
    if (defaultUser.rows.length > 0) return defaultUser.rows[0].id_usuario;
    const firstUser = await pool.query('SELECT id_usuario FROM usuario LIMIT 1');
    return firstUser.rows[0]?.id_usuario;
  }

  const clean = identifier.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  if (isUuid) {
    const res = await pool.query('SELECT id_usuario FROM usuario WHERE id_usuario = $1', [clean]);
    if (res.rows.length > 0) return res.rows[0].id_usuario;
  }

  const res = await pool.query(
    'SELECT id_usuario FROM usuario WHERE LOWER(nome) = LOWER($1) OR LOWER(email) = LOWER($1) OR LOWER(nome) LIKE LOWER($1) || \'%\' OR LOWER(nome) LIKE \'%\' || LOWER($1) || \'%\' LIMIT 1',
    [clean]
  );
  if (res.rows.length > 0) return res.rows[0].id_usuario;

  const defaultUser = await pool.query("SELECT id_usuario FROM usuario WHERE LOWER(nome) LIKE '%henrique%' LIMIT 1");
  if (defaultUser.rows.length > 0) return defaultUser.rows[0].id_usuario;

  const firstUser = await pool.query('SELECT id_usuario FROM usuario LIMIT 1');
  return firstUser.rows[0]?.id_usuario || null;
}

export async function getCurrentModuloDB(content, userId) {
  const resolvedId = await resolveUserId(userId);
  const result = await pool.query(
    `SELECT ${content} FROM usuario WHERE id_usuario = $1`,
    [resolvedId]
  );
  return result;
}

export async function nextCurrentModuloDB(content, userId) {
  const resolvedId = await resolveUserId(userId);
  const result = await pool.query(
    `UPDATE usuario SET ${content} = LEAST(10, COALESCE(${content}, 0) + 1) WHERE id_usuario = $1 RETURNING ${content}`,
    [resolvedId]
  );
  return result;
}