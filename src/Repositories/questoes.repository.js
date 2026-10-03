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

export async function initBateriaHistoricoTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bateria_historico_log (
        id SERIAL PRIMARY KEY,
        id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        materia VARCHAR(50) NOT NULL,
        bateria INTEGER NOT NULL DEFAULT 1,
        acertos INTEGER NOT NULL DEFAULT 0,
        total_questoes INTEGER NOT NULL DEFAULT 10,
        porcentagem INTEGER NOT NULL DEFAULT 0,
        aprovado BOOLEAN NOT NULL DEFAULT FALSE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bateria_hist_user_date ON bateria_historico_log (id_usuario, criado_em);
      CREATE INDEX IF NOT EXISTS idx_bateria_hist_user_mat ON bateria_historico_log (id_usuario, materia);
    `);
  } catch (err) {
    console.warn('[QuestoesRepository] Erro ao assegurar tabela bateria_historico_log:', err.message);
  }
}

export async function initQuestaoRespostaTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questao_resposta_log (
        id SERIAL PRIMARY KEY,
        id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        materia VARCHAR(50) NOT NULL,
        bateria INTEGER NOT NULL DEFAULT 1,
        numero_questao INTEGER,
        correto BOOLEAN NOT NULL DEFAULT FALSE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_questao_resp_user_date ON questao_resposta_log (id_usuario, criado_em);
      CREATE INDEX IF NOT EXISTS idx_questao_resp_user_mat ON questao_resposta_log (id_usuario, materia, correto);
    `);
  } catch (err) {
    console.warn('[QuestoesRepository] Erro ao assegurar tabela questao_resposta_log:', err.message);
  }
}

export async function salvarQuestaoRespostaLog(userId, materia, bateria, numeroQuestao, correto, dataReferencia = null) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;
  await initQuestaoRespostaTable();
  const ts = dataReferencia ? new Date(dataReferencia) : new Date();

  try {
    const res = await pool.query(
      `INSERT INTO questao_resposta_log (id_usuario, materia, bateria, numero_questao, correto, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [resolvedId, String(materia), Number(bateria || 1), Number(numeroQuestao || 1), Boolean(correto), ts]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.warn('[QuestoesRepository] Falha ao salvar log de questao:', err.message);
    return null;
  }
}

export async function salvarResultadoBateria(userId, materia, bateria, acertos, totalQuestoes, porcentagem, aprovado, dataReferencia = null) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;
  await initBateriaResultadoTable();
  await initBateriaHistoricoTable();

  const ts = dataReferencia ? new Date(dataReferencia) : new Date();


  const res = await pool.query(
    `INSERT INTO bateria_resultado (id_usuario, materia, bateria, acertos, total_questoes, porcentagem, aprovado, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id_usuario, materia, bateria) DO UPDATE SET
       acertos = GREATEST(bateria_resultado.acertos, EXCLUDED.acertos),
       total_questoes = GREATEST(bateria_resultado.total_questoes, EXCLUDED.total_questoes),
       porcentagem = GREATEST(bateria_resultado.porcentagem, EXCLUDED.porcentagem),
       aprovado = (bateria_resultado.aprovado OR EXCLUDED.aprovado),
       atualizado_em = $8
     RETURNING *;`,
    [resolvedId, materia, Number(bateria), Number(acertos), Number(totalQuestoes), Number(porcentagem), Boolean(aprovado), ts]
  );

  try {
    await pool.query(
      `INSERT INTO bateria_historico_log (id_usuario, materia, bateria, acertos, total_questoes, porcentagem, aprovado, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [resolvedId, materia, Number(bateria), Number(acertos), Number(totalQuestoes), Number(porcentagem), Boolean(aprovado), ts]
    );
  } catch (err) {
    console.warn('[QuestoesRepository] Erro ao gravar historico de bateria:', err.message);
  }

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

export async function salvarResultadoSimulado(userId, materia, acertos, totalQuestoes, porcentagem, aprovado, tempoGastoSegundos = 0, dataReferencia = null) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) return null;
  await initSimuladoResultadoTable();
  const ts = dataReferencia ? new Date(dataReferencia) : new Date();

  const res = await pool.query(
    `INSERT INTO simulado_resultado (id_usuario, materia, acertos, total_questoes, porcentagem, aprovado, tempo_gasto_segundos, criado_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *;`,
    [resolvedId, String(materia || 'Geral'), Number(acertos), Number(totalQuestoes || 30), Number(porcentagem), Boolean(aprovado), Number(tempoGastoSegundos || 0), ts]
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

export async function initQuestoesCustomizadasTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questao_customizada (
        id VARCHAR(255) PRIMARY KEY,
        materia VARCHAR(100) NOT NULL,
        bateria_numero INTEGER NOT NULL DEFAULT 1,
        modulo INTEGER DEFAULT 1,
        numero INTEGER DEFAULT 1,
        texto TEXT NOT NULL,
        opcoes JSONB NOT NULL,
        correta INTEGER NOT NULL,
        correta_letra VARCHAR(5) NOT NULL,
        explicacao TEXT,
        incluir_no_simulado BOOLEAN DEFAULT TRUE,
        removido BOOLEAN DEFAULT FALSE,
        criado_por VARCHAR(255),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_questao_customizada_materia ON questao_customizada(materia);
      CREATE INDEX IF NOT EXISTS idx_questao_customizada_bateria ON questao_customizada(bateria_numero);

      CREATE TABLE IF NOT EXISTS simulado_customizado (
        id VARCHAR(255) PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        materia VARCHAR(100) NOT NULL DEFAULT 'Geral',
        descricao TEXT,
        duracao_minutos INTEGER DEFAULT 40,
        total_questoes INTEGER DEFAULT 30,
        meta_acertos INTEGER DEFAULT 20,
        removido BOOLEAN DEFAULT FALSE,
        criado_por VARCHAR(255),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_simulado_customizado_materia ON simulado_customizado(materia);
    `);
  } catch (err) {
    console.error('[DB] Erro ao assegurar tabelas de questões e simulados customizados:', err.message);
  }
}

export async function salvarQuestaoCustomizada(dados, adminId = null) {
  await initQuestoesCustomizadasTables();

  const id = dados.id || `q-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const materia = dados.materia || 'CodigoTransito';
  const bateriaNumero = Number(dados.bateria_numero || dados.bateriaNumero || 1);
  const modulo = Number(dados.modulo || 1);
  const numero = Number(dados.numero || 1);
  const texto = String(dados.texto || '').trim();
  const opcoes = Array.isArray(dados.opcoes) ? dados.opcoes : [];
  const correta = Number(dados.correta ?? 0);
  const corretaLetra = String(dados.correta_letra || dados.corretaLetra || ['A', 'B', 'C', 'D'][correta] || 'A').toUpperCase();
  const explicacao = String(dados.explicacao || '').trim();
  const incluirNoSimulado = dados.incluir_no_simulado !== undefined ? Boolean(dados.incluir_no_simulado) : true;
  const criadoPor = adminId ? String(adminId).trim() : 'admin';

  const query = `
    INSERT INTO questao_customizada (
      id, materia, bateria_numero, modulo, numero, texto, opcoes, correta, correta_letra, explicacao, incluir_no_simulado, removido, criado_por, criado_em, atualizado_em
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, $12, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      materia = EXCLUDED.materia,
      bateria_numero = EXCLUDED.bateria_numero,
      modulo = EXCLUDED.modulo,
      numero = EXCLUDED.numero,
      texto = EXCLUDED.texto,
      opcoes = EXCLUDED.opcoes,
      correta = EXCLUDED.correta,
      correta_letra = EXCLUDED.correta_letra,
      explicacao = EXCLUDED.explicacao,
      incluir_no_simulado = EXCLUDED.incluir_no_simulado,
      removido = FALSE,
      atualizado_em = NOW()
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    id, materia, bateriaNumero, modulo, numero, texto, JSON.stringify(opcoes), correta, corretaLetra, explicacao, incluirNoSimulado, criadoPor
  ]);

  return rows[0];
}

export async function listarQuestoesCustomizadas(materia = null, bateriaNumero = null) {
  await initQuestoesCustomizadasTables();

  let query = 'SELECT * FROM questao_customizada WHERE removido = FALSE';
  const params = [];

  if (materia) {
    params.push(materia);
    query += ` AND (LOWER(materia) = LOWER($${params.length}) OR materia = $${params.length})`;
  }

  if (bateriaNumero) {
    params.push(Number(bateriaNumero));
    query += ` AND bateria_numero = $${params.length}`;
  }

  query += ' ORDER BY criado_em ASC, numero ASC';

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function removerQuestaoCustomizada(id) {
  await initQuestoesCustomizadasTables();
  await pool.query('UPDATE questao_customizada SET removido = TRUE, atualizado_em = NOW() WHERE id = $1', [id]);
  return true;
}

export async function salvarSimuladoCustomizado(dados, adminId = null) {
  await initQuestoesCustomizadasTables();

  const id = dados.id || `sim-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const titulo = String(dados.titulo || 'Simulado Personalizado').trim();
  const materia = String(dados.materia || 'Geral').trim();
  const descricao = String(dados.descricao || '').trim();
  const duracaoMinutos = Number(dados.duracao_minutos || dados.duracaoMinutos || 40);
  const totalQuestoes = Number(dados.total_questoes || dados.totalQuestoes || 30);
  const metaAcertos = Number(dados.meta_acertos || dados.metaAcertos || 20);
  const criadoPor = adminId ? String(adminId).trim() : 'admin';

  const query = `
    INSERT INTO simulado_customizado (
      id, titulo, materia, descricao, duracao_minutos, total_questoes, meta_acertos, removido, criado_por, criado_em, atualizado_em
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      materia = EXCLUDED.materia,
      descricao = EXCLUDED.descricao,
      duracao_minutos = EXCLUDED.duracao_minutos,
      total_questoes = EXCLUDED.total_questoes,
      meta_acertos = EXCLUDED.meta_acertos,
      removido = FALSE,
      atualizado_em = NOW()
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    id, titulo, materia, descricao, duracaoMinutos, totalQuestoes, metaAcertos, criadoPor
  ]);

  return rows[0];
}

export async function listarSimuladosCustomizados(materia = null) {
  await initQuestoesCustomizadasTables();

  let query = 'SELECT * FROM simulado_customizado WHERE removido = FALSE';
  const params = [];

  if (materia && materia !== 'todos' && materia !== 'Todos') {
    params.push(materia);
    query += ` AND (LOWER(materia) = LOWER($${params.length}) OR materia = $${params.length})`;
  }

  query += ' ORDER BY criado_em DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function removerSimuladoCustomizado(id) {
  await initQuestoesCustomizadasTables();
  await pool.query('UPDATE simulado_customizado SET removido = TRUE, atualizado_em = NOW() WHERE id = $1', [id]);
  return true;
}