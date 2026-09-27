import fs from 'fs';
import path from 'path';
import pool from '../Repositories/db.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'pdfs');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

    return {
      success: true,
      message: 'Módulo / Material em PDF configurado com sucesso!',
      modulo: rows[0]
    };
  },

  async removerModulo(id, conteudoId = null) {
    if (!id) {
      const err = new Error('ID do módulo é obrigatório.');
      err.statusCode = 400;
      throw err;
    }

    // Se for módulo que já está na tabela, marca como removido
    const check = await pool.query('SELECT * FROM modulo_customizado WHERE id = $1', [id]);

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

    return {
      success: true,
      message: 'Módulo / PDF removido com sucesso pelo administrador!'
    };
  },

  async restaurarModulo(id) {
    await pool.query(
      'UPDATE modulo_customizado SET removido = FALSE, atualizado_em = NOW() WHERE id = $1',
      [id]
    );

    return {
      success: true,
      message: 'Módulo restaurado com sucesso!'
    };
  }
};

export default moduloCustomizadoService;
