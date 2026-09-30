import pool from './db.js';
import { resolveUserId } from './modulo.repository.js';

const COLUNAS_VALIDAS = new Set([
  'acertos_codigotransito',
  'acertos_placatransito',
  'acertos_direcaodefensiva',
  'acertos_primeirossocorros',
  'acertos_meioambiente'
]);

const COLUNAS_ERROS_VALIDAS = new Set([
  'erros_codigotransito',
  'erros_placatransito',
  'erros_direcaodefensiva',
  'erros_primeirossocorros',
  'erros_meioambiente'
]);

export async function initErrosColunas() {
  try {
    await pool.query(`
      ALTER TABLE usuario
      ADD COLUMN IF NOT EXISTS erros_codigotransito INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS erros_placatransito INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS erros_direcaodefensiva INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS erros_primeirossocorros INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS erros_meioambiente INTEGER DEFAULT 0;
    `);
  } catch (err) {
    console.error('[DB] Erro ao assegurar colunas de erros:', err.message);
  }
}

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

export async function incrementarErro(colunaErro, userId, quantidade = 1) {
  const resolvedId = await resolveUserId(userId);
  if (!COLUNAS_ERROS_VALIDAS.has(colunaErro) || !resolvedId) return null;
  await initErrosColunas();
  const qtd = Math.max(1, Number(quantidade) || 1);
  const response = await pool.query(
    `UPDATE usuario SET ${colunaErro} = COALESCE(${colunaErro}, 0) + $1 WHERE id_usuario = $2 RETURNING ${colunaErro}`,
    [qtd, resolvedId]
  );
  return response.rows[0]?.[colunaErro] ?? null;
}

export async function salvarResultadoBateria(userId, materia, bateria, acertos, totalQuestoes, porcentagem, aprovado) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;
  await initBateriaResultadoTable();
  const res = await pool.query(
    `INSERT INTO bateria_resultado (id_usuario, materia, bateria, acertos, total_questoes, porcentagem, aprovado, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (id_usuario, materia, bateria) DO UPDATE SET
       acertos = GREATEST(bateria_resultado.acertos, EXCLUDED.acertos),
       total_questoes = GREATEST(bateria_resultado.total_questoes, EXCLUDED.total_questoes),
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
  await initBateriaResultadoTable();
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

export async function initSimuladoResultadoTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS simulado_resultado (
        id_simulado SERIAL PRIMARY KEY,
        id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        materia VARCHAR(50) NOT NULL,
        acertos INTEGER NOT NULL DEFAULT 0,
        total_questoes INTEGER NOT NULL DEFAULT 30,
        porcentagem INTEGER NOT NULL DEFAULT 0,
        aprovado BOOLEAN NOT NULL DEFAULT FALSE,
        tempo_gasto_segundos INTEGER DEFAULT 0,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error('[DB] Erro ao assegurar tabela simulado_resultado:', err.message);
  }
}

export async function salvarResultadoSimulado(userId, materia, acertos, totalQuestoes, porcentagem, aprovado, tempoGastoSegundos = 0) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;
  await initSimuladoResultadoTable();
  const res = await pool.query(
    `INSERT INTO simulado_resultado (id_usuario, materia, acertos, total_questoes, porcentagem, aprovado, tempo_gasto_segundos, criado_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *;`,
    [resolvedId, String(materia || 'Geral'), Number(acertos), Number(totalQuestoes || 30), Number(porcentagem), Boolean(aprovado), Number(tempoGastoSegundos || 0)]
  );
  return res.rows[0] || null;
}

export async function obterResultadosSimuladosUsuario(userId) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return [];
  await initSimuladoResultadoTable();
  const res = await pool.query(
    `SELECT id_simulado, materia, acertos, total_questoes, porcentagem, aprovado, tempo_gasto_segundos, criado_em 
     FROM simulado_resultado 
     WHERE id_usuario = $1 
     ORDER BY criado_em DESC`,
    [resolvedId]
  );
  return res.rows;
}

export async function isSimuladoAprovado(userId, materia = null, percentualAlvo = 67, acertosNecessarios = 20) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return false;
  await initSimuladoResultadoTable();
  let query = `
    SELECT 1 FROM simulado_resultado 
    WHERE id_usuario = $1 
      AND (aprovado = TRUE OR porcentagem >= $2 OR acertos >= $3)
  `;
  const params = [resolvedId, Number(percentualAlvo), Number(acertosNecessarios)];
  if (materia && materia !== 'todos' && materia !== 'Geral' && materia !== 'geral') {
    query += ` AND LOWER(materia) = LOWER($4)`;
    params.push(materia);
  }
  query += ` LIMIT 1`;
  const res = await pool.query(query, params);
  return res.rows.length > 0;
}