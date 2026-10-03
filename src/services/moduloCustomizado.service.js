import fs from 'fs';
import path from 'path';
import pool from '../Repositories/db.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'pdfs');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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
    ensureUploadDir();

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

    // Se foi enviado PDF via base64, salva o arquivo fisicamente na pasta uploads/pdfs
    if (pdf_base64 && typeof pdf_base64 === 'string') {
      const base64Data = pdf_base64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
      const sanitizedName = (pdf_nome || `material_${Date.now()}.pdf`).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const uniqueFilename = `${Date.now()}_${sanitizedName}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);

      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
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
      conteudo_id,
      num,
      titulo.trim(),
      desc.trim(),
      dur,
      top,
      pNome,
      pUrl
    ]);

    const savedRow = rows[0];

    // Determina o tipo de ação para o histórico
    let tipoAcao = 'CRIACAO';
    let descAcao = `Criação do módulo "${savedRow.titulo}" com PDF "${savedRow.pdf_nome}"`;

    if (prevRow) {
      if (prevRow.pdf_url !== savedRow.pdf_url || prevRow.pdf_nome !== savedRow.pdf_nome) {
        tipoAcao = 'EDICAO_PDF';
        descAcao = `Substituição do PDF de "${prevRow.pdf_nome || 'PDF anterior'}" para "${savedRow.pdf_nome}"`;
      } else {
        tipoAcao = 'EDICAO_MODULO';
        descAcao = `Edição das informações do módulo "${savedRow.titulo}"`;
      }
    }

    await registrarHistorico({
      moduloId: savedRow.id,
      conteudoId: savedRow.conteudo_id,
      tipoAcao,
      descricaoAcao: descAcao,
      adminId: requesterId,
      dadosAnteriores: prevRow,
      dadosNovos: savedRow
    });

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

    let query = 'SELECT * FROM modulo_pdf_historico';
    let params = [];
    let conditions = [];

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

    query += ' ORDER BY criado_em DESC LIMIT 150';

    const { rows } = await pool.query(query, params);

    return {
      success: true,
      historico: rows
    };
  },

  async reverterHistorico(historicoId, requesterId = null, targetVersion = 'anterior') {
    await initHistoricoTable();

    const histCheck = await pool.query('SELECT * FROM modulo_pdf_historico WHERE id = $1', [historicoId]);
    if (histCheck.rows.length === 0) {
      const err = new Error('Registro de histórico não encontrado.');
      err.statusCode = 404;
      throw err;
    }

    const hist = histCheck.rows[0];

    // Determina o estado a ser restaurado:
    // 'anterior' -> restaura os dados como estavam antes daquela alteração (se houver dados_anteriores, senão usa dados_novos)
    // 'versao' ou 'novos' -> restaura os dados daquela versão específica (dados_novos)
    let targetState = null;
    if (targetVersion === 'depois' || targetVersion === 'novos' || targetVersion === 'versao') {
      targetState = hist.dados_novos || hist.dados_anteriores;
    } else {
      targetState = hist.dados_anteriores || hist.dados_novos;
    }

    if (!targetState) {
      const err = new Error('Não há dados históricos gravados para reverter este registro.');
      err.statusCode = 400;
      throw err;
    }

    const moduloId = hist.modulo_id;
    const currentCheck = await pool.query('SELECT * FROM modulo_customizado WHERE id = $1', [moduloId]);
    const currentState = currentCheck.rows[0] || null;

    const query = `
      INSERT INTO modulo_customizado (
        id, conteudo_id, numero, titulo, descricao, duracao, topicos, pdf_nome, pdf_url, removido, is_custom, atualizado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW())
      ON CONFLICT (id) DO UPDATE SET
        conteudo_id = EXCLUDED.conteudo_id,
        numero = EXCLUDED.numero,
        titulo = EXCLUDED.titulo,
        descricao = EXCLUDED.descricao,
        duracao = EXCLUDED.duracao,
        topicos = EXCLUDED.topicos,
        pdf_nome = EXCLUDED.pdf_nome,
        pdf_url = EXCLUDED.pdf_url,
        removido = EXCLUDED.removido,
        atualizado_em = NOW()
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      moduloId,
      targetState.conteudo_id || hist.conteudo_id,
      targetState.numero !== undefined ? Number(targetState.numero) : 99,
      targetState.titulo || 'Módulo Revertido',
      targetState.descricao || '',
      targetState.duracao || '20 min',
      targetState.topicos !== undefined ? Number(targetState.topicos) : 4,
      targetState.pdf_nome || 'material_revertido.pdf',
      targetState.pdf_url || '',
      Boolean(targetState.removido)
    ]);

    const revertedRow = rows[0];

    const dataOriginal = new Date(hist.criado_em).toLocaleString('pt-BR');
    await registrarHistorico({
      moduloId,
      conteudoId: hist.conteudo_id,
      tipoAcao: 'REVERSAO',
      descricaoAcao: `Reversão para a versão #${historicoId} (${dataOriginal}) - PDF: "${revertedRow.pdf_nome}"`,
      adminId: requesterId,
      dadosAnteriores: currentState,
      dadosNovos: revertedRow
    });

    return {
      success: true,
      message: `Módulo e PDF revertidos com sucesso para a versão #${historicoId}!`,
      modulo: revertedRow
    };
  },

  async removerItemHistorico(historicoId, requesterId = null) {
    await initHistoricoTable();
    const { rows } = await pool.query('DELETE FROM modulo_pdf_historico WHERE id = $1 RETURNING *', [historicoId]);
    if (rows.length === 0) {
      const err = new Error('Registro de histórico não encontrado.');
      err.statusCode = 404;
      throw err;
    }
    return {
      success: true,
      message: `Registro de histórico #${historicoId} excluído com sucesso!`,
      item: rows[0]
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

    return {
      success: true,
      message: `${rowCount} registro(s) de histórico excluído(s) com sucesso!`,
      removidos: rowCount
    };
  }
};

export default moduloCustomizadoService;
