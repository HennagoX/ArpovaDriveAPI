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
    `UPDATE usuario SET ${content} = COALESCE(${content}, 0) + 1 WHERE id_usuario = $1 RETURNING ${content}`,
    [resolvedId]
  );
  return result;
}

export async function setModuloDB(content, userId, novoNumero) {
  const resolvedId = await resolveUserId(userId);
  const num = Math.max(1, Number(novoNumero) || 1);
  const result = await pool.query(
    `UPDATE usuario SET ${content} = $1 WHERE id_usuario = $2 RETURNING ${content}`,
    [num, resolvedId]
  );
  return result;
}

export async function initModuloLeituraTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modulo_leitura_log (
        id SERIAL PRIMARY KEY,
        id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        conteudo VARCHAR(50) NOT NULL,
        modulo INTEGER NOT NULL DEFAULT 1,
        lido_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_modulo_leitura_user_date ON modulo_leitura_log (id_usuario, lido_em);
      CREATE INDEX IF NOT EXISTS idx_modulo_leitura_user_conteudo ON modulo_leitura_log (id_usuario, conteudo, modulo);
    `);
  } catch (err) {
    console.warn('[ModuloRepository] Erro ao assegurar tabela modulo_leitura_log:', err.message);
  }
}

export async function registrarLeituraModuloDB(conteudo, modulo, userId, dataReferencia = null) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;
  await initModuloLeituraTable();

  const ts = dataReferencia ? new Date(dataReferencia) : new Date();
  const res = await pool.query(
    `INSERT INTO modulo_leitura_log (id_usuario, conteudo, modulo, lido_em)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [resolvedId, String(conteudo), Math.max(1, Number(modulo) || 1), ts]
  );
  return res.rows[0] || null;
}

export async function getLeiturasModulosUsuario(userId) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return [];
  await initModuloLeituraTable();

  const res = await pool.query(
    `SELECT id, id_usuario, conteudo, modulo, lido_em
     FROM modulo_leitura_log
     WHERE id_usuario = $1
     ORDER BY lido_em DESC`,
    [resolvedId]
  );
  return res.rows;
}