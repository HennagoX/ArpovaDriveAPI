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

export async function initBateriaResultadoTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bateria_resultado (
        id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        materia VARCHAR(50) NOT NULL,
        bateria INTEGER NOT NULL,
        acertos INTEGER NOT NULL DEFAULT 0,
        total_questoes INTEGER NOT NULL DEFAULT 10,
        porcentagem INTEGER NOT NULL DEFAULT 0,
        aprovado BOOLEAN NOT NULL DEFAULT FALSE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (id_usuario, materia, bateria)
      );
    `);
  } catch (err) {
    console.error('[DB] Erro ao assegurar tabela bateria_resultado:', err.message);
  }
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

export async function salvarResultadoBateria(userId, materia, bateria, acertos, totalQuestoes, porcentagem, aprovado) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;
  const res = await pool.query(
    `INSERT INTO bateria_resultado (id_usuario, materia, bateria, acertos, total_questoes, porcentagem, aprovado, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (id_usuario, materia, bateria) DO UPDATE SET
       acertos = GREATEST(bateria_resultado.acertos, EXCLUDED.acertos),
       total_questoes = EXCLUDED.total_questoes,
       porcentagem = GREATEST(bateria_resultado.porcentagem, EXCLUDED.porcentagem),
       aprovado = (bateria_resultado.aprovado OR EXCLUDED.aprovado),
       atualizado_em = NOW()
     RETURNING *;`,
    [resolvedId, materia, Number(bateria), Number(acertos), Number(totalQuestoes), Number(porcentagem), Boolean(aprovado)]
  );
  return res.rows[0] || null;
}

export async function obterResultadosBateriasUsuario(userId) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return [];
  const res = await pool.query(
    `SELECT materia, bateria, acertos, total_questoes, porcentagem, aprovado, atualizado_em 
     FROM bateria_resultado 
     WHERE id_usuario = $1 
     ORDER BY materia ASC, bateria ASC`,
    [resolvedId]
  );
  return res.rows;
}

export async function isBateriaAprovada(userId, materia, bateria, percentualAlvo = 70) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return false;
  const res = await pool.query(
    `SELECT 1 FROM bateria_resultado 
     WHERE id_usuario = $1 
       AND LOWER(materia) = LOWER($2) 
       AND bateria = $3 
       AND (aprovado = TRUE OR porcentagem >= $4) 
     LIMIT 1`,
    [resolvedId, materia, Number(bateria), Number(percentualAlvo)]
  );
  return res.rows.length > 0;
}