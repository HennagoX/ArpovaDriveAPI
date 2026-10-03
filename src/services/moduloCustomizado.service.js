import fs from 'fs';
import path from 'path';
import os from 'os';
import pool from '../Repositories/db.js';

function getUploadDir() {
  const localDir = path.join(process.cwd(), 'uploads', 'pdfs');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'aprovadrive', 'uploads', 'pdfs');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch (tmpErr) {
      console.warn('[ModuloCustomizadoService] Sistema de arquivos somente leitura, operando em modo database:', tmpErr.message);
      return null;
    }
  }
}

export async function initModuloCustomizadoTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modulo_customizado (
        id VARCHAR(255) PRIMARY KEY,
        conteudo_id VARCHAR(100) NOT NULL,
        numero INTEGER NOT NULL DEFAULT 1,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        duracao VARCHAR(50) DEFAULT '20 min',
        topicos INTEGER DEFAULT 4,
        pdf_nome VARCHAR(255),
        pdf_url TEXT,
        pdf_base64 TEXT,
        removido BOOLEAN DEFAULT FALSE,
        is_custom BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_modulo_customizado_conteudo ON modulo_customizado(conteudo_id);
      ALTER TABLE modulo_customizado ADD COLUMN IF NOT EXISTS pdf_base64 TEXT;
    `);
  } catch (err) {
    console.error('[ModuloCustomizadoService] Erro ao assegurar tabela modulo_customizado:', err.message);
  }
}

export async function initHistoricoTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modulo_pdf_historico (
        id SERIAL PRIMARY KEY,
        modulo_id VARCHAR(255) NOT NULL,
        conteudo_id VARCHAR(100) NOT NULL,
        tipo_acao VARCHAR(50) NOT NULL,
        descricao_acao TEXT,
        admin_id VARCHAR(255),
        dados_anteriores JSONB,
        dados_novos JSONB,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_modulo_pdf_historico_conteudo ON modulo_pdf_historico(conteudo_id);
      CREATE INDEX IF NOT EXISTS idx_modulo_pdf_historico_modulo ON modulo_pdf_historico(modulo_id);
    `);
  } catch (err) {
    console.error('[ModuloCustomizadoService] Erro ao assegurar tabela modulo_pdf_historico:', err.message);
  }
}

async function registrarHistorico({
  moduloId,
  conteudoId,
  tipoAcao,
  descricaoAcao,
  adminId,
  dadosAnteriores = null,
  dadosNovos = null
}) {
  try {
    await initHistoricoTable();
    await pool.query(
      `INSERT INTO modulo_pdf_historico (
        modulo_id, conteudo_id, tipo_acao, descricao_acao, admin_id, dados_anteriores, dados_novos, criado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        moduloId,
        conteudoId,
        tipoAcao,
        descricaoAcao,
        adminId ? String(adminId).trim() : 'admin',
        dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
        dadosNovos ? JSON.stringify(dadosNovos) : null
      ]
    );
  } catch (err) {
    console.error('[ModuloCustomizadoService] Erro ao registrar histórico de PDF:', err.message);
  }
}

export const moduloCustomizadoService = {
  async listarModulos(conteudoId = null) {
    await initModuloCustomizadoTable();

    let query = 'SELECT * FROM modulo_customizado';
    let params = [];

    if (conteudoId) {
      query += ' WHERE conteudo_id = $1';
      params.push(conteudoId);
    }

    query += ' ORDER BY numero ASC, criado_em ASC';

    const { rows } = await pool.query(query, params);

    const removidos = rows.filter(r => r.removido).map(r => r.id);
    const ativos = rows.filter(r => !r.removido);

    return {
      success: true,
      modulos: ativos,
      removidos
    };
  },

  async salvarModulo(dados, requesterId = null) {
    await initModuloCustomizadoTable();

    let {
      id,
      conteudo_id,
      numero,
      titulo,
      descricao,
      duracao,
      topicos,
      pdf_url,
      pdf_nome,
      pdf_base64
    } = dados;

    if (!conteudo_id) {
      const err = new Error('O conteúdo de estudo (conteudo_id) é obrigatório.');
      err.statusCode = 400;
      throw err;
    }

    if (!titulo || !titulo.trim()) {
      const err = new Error('O título do módulo é obrigatório.');
      err.statusCode = 400;
      throw err;
    }

    // Se foi enviado PDF via base64, salva o arquivo fisicamente como cache temporário se possível e no banco
    if (pdf_base64 && typeof pdf_base64 === 'string') {
      const base64Data = pdf_base64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
      const sanitizedName = (pdf_nome || `material_${Date.now()}.pdf`).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const uniqueFilename = `${Date.now()}_${sanitizedName}`;

      const uploadDir = getUploadDir();
      if (uploadDir) {
        try {
          const filePath = path.join(uploadDir, uniqueFilename);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        } catch (err) {
          console.warn('[ModuloCustomizadoService] Aviso ao gravar PDF em disco temporário:', err.message);
        }
      }

      pdf_url = `/uploads/pdfs/${uniqueFilename}`;
      pdf_nome = sanitizedName;
    }

    // Se id não informado, cria id único
    const moduloId = (id && String(id).trim()) || `mod-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const num = numero ? Number(numero) : 99;
    const dur = duracao || '20 min';
    const top = topicos ? Number(topicos) : 4;
    const desc = descricao || '';
    const pUrl = pdf_url || '';
    const pNome = pdf_nome || (pUrl ? path.basename(pUrl) : 'Material PDF');

    // Consulta estado anterior para registro no histórico
    const checkPrev = await pool.query('SELECT * FROM modulo_customizado WHERE id = $1', [moduloId]);
    const prevRow = checkPrev.rows[0] || null;

    const query = `
      INSERT INTO modulo_customizado (
        id, conteudo_id, numero, titulo, descricao, duracao, topicos, pdf_nome, pdf_url, pdf_base64, removido, is_custom, atualizado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, TRUE, NOW())
      ON CONFLICT (id) DO UPDATE SET
        conteudo_id = EXCLUDED.conteudo_id,
        numero = EXCLUDED.numero,
        titulo = EXCLUDED.titulo,
        descricao = EXCLUDED.descricao,
        duracao = EXCLUDED.duracao,
        topicos = EXCLUDED.topicos,
        pdf_nome = EXCLUDED.pdf_nome,
        pdf_url = EXCLUDED.pdf_url,
        pdf_base64 = COALESCE(EXCLUDED.pdf_base64, modulo_customizado.pdf_base64),
        removido = FALSE,
        atualizado_em = NOW()
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      moduloId,
      conteudo_id,
      num,
      titulo.trim(),
      desc.trim(),
      dur,
      top,
      pNome,
      pUrl,
      pdf_base64 || prevRow?.pdf_base64 || null
    ]);

    const savedRow = rows[0];

    // Se o módulo já existia e teve seu PDF anterior substituído, registra o arquivo antigo para possível restauração
    if (prevRow && (prevRow.pdf_url || prevRow.pdf_nome) && (prevRow.pdf_url !== savedRow.pdf_url || prevRow.pdf_nome !== savedRow.pdf_nome)) {
      await registrarHistorico({
        moduloId: savedRow.id,
        conteudoId: savedRow.conteudo_id,
        tipoAcao: 'REMOCAO',
        descricaoAcao: `Arquivo anterior "${prevRow.pdf_nome || 'PDF'}" substituído no módulo "${savedRow.titulo}"`,
        adminId: requesterId,
        dadosAnteriores: savedRow,
        dadosNovos: prevRow
      });
    }

    return {
      success: true,
      message: 'Módulo / Material em PDF configurado com sucesso!',
      modulo: savedRow
    };
  },

  async removerModulo(id, conteudoId = null, requesterId = null) {
    if (!id) {
      const err = new Error('ID do módulo é obrigatório.');
      err.statusCode = 400;
      throw err;
    }

    // Se for módulo que já está na tabela, marca como removido
    const check = await pool.query('SELECT * FROM modulo_customizado WHERE id = $1', [id]);
    const prevRow = check.rows[0] || null;

    if (check.rows.length > 0) {
      await pool.query(
        'UPDATE modulo_customizado SET removido = TRUE, atualizado_em = NOW() WHERE id = $1',
        [id]
      );
    } else {
      // Se for um módulo padrão (base) que o admin está ocultando/removendo
      await pool.query(`
        INSERT INTO modulo_customizado (
          id, conteudo_id, numero, titulo, removido, is_custom, atualizado_em
        ) VALUES ($1, $2, 0, 'Módulo Ocultado', TRUE, FALSE, NOW())
        ON CONFLICT (id) DO UPDATE SET
          removido = TRUE,
          atualizado_em = NOW();
      `, [id, conteudoId || 'geral']);
    }

    await registrarHistorico({
      moduloId: id,
      conteudoId: prevRow?.conteudo_id || conteudoId || 'geral',
      tipoAcao: 'REMOCAO',
      descricaoAcao: `Módulo / PDF "${prevRow?.titulo || id}" removido pelo administrador`,
      adminId: requesterId,
      dadosAnteriores: prevRow,
      dadosNovos: { ...(prevRow || {}), removido: true }
    });

    return {
      success: true,
      message: 'Módulo / PDF removido com sucesso pelo administrador!'
    };
  },

  async restaurarModulo(id, requesterId = null) {
    const check = await pool.query('SELECT * FROM modulo_customizado WHERE id = $1', [id]);
    const prevRow = check.rows[0] || null;

    const { rows } = await pool.query(
      'UPDATE modulo_customizado SET removido = FALSE, atualizado_em = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    const updatedRow = rows[0] || null;

    await registrarHistorico({
      moduloId: id,
      conteudoId: prevRow?.conteudo_id || 'geral',
      tipoAcao: 'RESTAURACAO',
      descricaoAcao: `Módulo / PDF "${prevRow?.titulo || id}" restaurado pelo administrador`,
      adminId: requesterId,
      dadosAnteriores: prevRow,
      dadosNovos: updatedRow
    });

    return {
      success: true,
      message: 'Módulo restaurado com sucesso!',
      modulo: updatedRow
    };
  },

  async listarHistorico(conteudoId = null, moduloId = null) {
    await initHistoricoTable();

    // Apenas arquivos e módulos DELETADOS anteriormente aparecem no histórico para restauração
    let query = "SELECT * FROM modulo_pdf_historico WHERE tipo_acao = 'REMOCAO'";
    let params = [];
    let conditions = ["tipo_acao = 'REMOCAO'"];

    if (conteudoId) {
      params.push(conteudoId);
      conditions.push(`conteudo_id = $${params.length}`);
    }

    if (moduloId) {
      params.push(moduloId);
      conditions.push(`modulo_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query = 'SELECT * FROM modulo_pdf_historico WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY criado_em DESC LIMIT 150';

    const { rows } = await pool.query(query, params);

    return {
      success: true,
      historico: rows
    };
  },

  async reverterHistorico(historicoId, requesterId = null, targetVersion = 'versao') {
    await initHistoricoTable();

    const histCheck = await pool.query('SELECT * FROM modulo_pdf_historico WHERE id = $1', [historicoId]);
    if (histCheck.rows.length === 0) {
      const err = new Error('Arquivo deletado não encontrado no histórico.');
      err.statusCode = 404;
      throw err;
    }

    const hist = histCheck.rows[0];
    const targetState = hist.dados_novos || hist.dados_anteriores;

    if (!targetState) {
      const err = new Error('Não há dados do arquivo para restaurar.');
      err.statusCode = 400;
      throw err;
    }

    const moduloId = hist.modulo_id;

    const query = `
      INSERT INTO modulo_customizado (
        id, conteudo_id, numero, titulo, descricao, duracao, topicos, pdf_nome, pdf_url, removido, is_custom, atualizado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, TRUE, NOW())
      ON CONFLICT (id) DO UPDATE SET
        conteudo_id = EXCLUDED.conteudo_id,
        numero = EXCLUDED.numero,
        titulo = EXCLUDED.titulo,
        descricao = EXCLUDED.descricao,
        duracao = EXCLUDED.duracao,
        topicos = EXCLUDED.topicos,
        pdf_nome = EXCLUDED.pdf_nome,
        pdf_url = EXCLUDED.pdf_url,
        removido = FALSE,
        atualizado_em = NOW()
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      moduloId,
      targetState.conteudo_id || hist.conteudo_id,
      targetState.numero !== undefined ? Number(targetState.numero) : 99,
      targetState.titulo || 'Módulo Restaurado',
      targetState.descricao || '',
      targetState.duracao || '20 min',
      targetState.topicos !== undefined ? Number(targetState.topicos) : 4,
      targetState.pdf_nome || 'material_restaurado.pdf',
      targetState.pdf_url || ''
    ]);

    const restoredRow = rows[0];

    // Como o arquivo/módulo foi restaurado, ele sai do histórico de deletados
    await pool.query('DELETE FROM modulo_pdf_historico WHERE id = $1', [historicoId]);

    return {
      success: true,
      message: `Arquivo "${restoredRow.pdf_nome || 'material.pdf'}" restaurado com sucesso!`,
      modulo: restoredRow
    };
  },

  async removerItemHistorico(historicoId, requesterId = null) {
    await initHistoricoTable();
    const histCheck = await pool.query('SELECT * FROM modulo_pdf_historico WHERE id = $1', [historicoId]);
    if (histCheck.rows.length === 0) {
      const err = new Error('Arquivo não encontrado no histórico.');
      err.statusCode = 404;
      throw err;
    }

    const hist = histCheck.rows[0];
    const moduloId = hist.modulo_id;

    // Remove do histórico permanentemente
    await pool.query('DELETE FROM modulo_pdf_historico WHERE id = $1', [historicoId]);

    // Se o módulo correspondente ainda estiver marcado como removido, purga definitivamente do banco
    if (moduloId) {
      await pool.query('DELETE FROM modulo_customizado WHERE id = $1 AND removido = TRUE', [moduloId]);
    }

    return {
      success: true,
      message: 'Arquivo deletado definitivamente!'
    };
  },

  async limparHistorico(conteudoId = null, moduloId = null, requesterId = null) {
    await initHistoricoTable();
    let query = 'DELETE FROM modulo_pdf_historico';
    const params = [];
    const conditions = [];

    if (conteudoId) {
      params.push(conteudoId);
      conditions.push(`conteudo_id = $${params.length}`);
    }
    if (moduloId) {
      params.push(moduloId);
      conditions.push(`modulo_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const { rowCount } = await pool.query(query, params);

    // Também purga os módulos marcados como removidos correspondentes
    if (conteudoId) {
      await pool.query('DELETE FROM modulo_customizado WHERE conteudo_id = $1 AND removido = TRUE', [conteudoId]);
    } else {
      await pool.query('DELETE FROM modulo_customizado WHERE removido = TRUE');
    }

    return {
      success: true,
      message: `${rowCount} arquivo(s) deletado(s) definitivamente!`,
      removidos: rowCount
    };
  }
};

export default moduloCustomizadoService;
