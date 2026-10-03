import bcrypt from 'bcrypt';
import pool from '../Repositories/db.js';
import { isUserAdmin, getAdminConfig } from '../config/admin.config.js';

export async function login(req, res, next) {
  const { email, senha } = req.body;

  try {
    const normalizedEmail = email?.toLowerCase().trim();
    const { rows } = await pool.query('SELECT * FROM usuario WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const usuario = rows[0];
    const admin = getAdminConfig();
    const isAdm = Boolean(usuario.is_admin === true || isUserAdmin(usuario));

    let senhaValida = false;
    if (isAdm && admin.password && senha === admin.password) {
      senhaValida = true;
    } else {
      senhaValida = await bcrypt.compare(senha, usuario.senha);
    }

    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        exp: Number(usuario.exp || 0),
        lv: Number(usuario.lv || 1),
        is_admin: isAdm
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  const { nome, email, senha, data_nascimento, pergunta_seguranca, resposta_seguranca } = req.body;

  try {
    const normalizedEmail = email?.toLowerCase().trim();

    const existingUser = await pool.query('SELECT id_usuario FROM usuario WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Esse e-mail já está em uso!' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    let respostaHash = null;
    if (resposta_seguranca) {
      respostaHash = await bcrypt.hash(resposta_seguranca.trim().toLowerCase(), 10);
    }

    const query = `
      INSERT INTO usuario(nome, email, senha, data_nascimento, pergunta_seguranca, resposta_seguranca, is_admin)
      VALUES($1, $2, $3, $4, $5, $6, FALSE)
      RETURNING id_usuario, nome, email, is_admin;
    `;

    const { rows } = await pool.query(query, [
      nome,
      normalizedEmail,
      senhaHash,
      data_nascimento,
      pergunta_seguranca?.trim() || null,
      respostaHash
    ]);

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function verificarEmail(req, res, next) {
  const email = (req.body?.email || req.query?.email)?.toLowerCase().trim();

  if (!email) {
    return res.status(400).json({ error: 'Por favor, informe o e-mail.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id_usuario FROM usuario WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    const exists = rows.length > 0;
    return res.status(200).json({
      exists,
      disponivel: !exists,
      message: exists ? 'Esse e-mail já está em uso!' : 'E-mail disponível para cadastro.'
    });
  } catch (error) {
    next(error);
  }
}

export async function getPerguntaSeguranca(req, res, next) {
  const email = (req.body?.email || req.query?.email)?.toLowerCase().trim();

  if (!email) {
    return res.status(400).json({ error: 'Por favor, informe o e-mail.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT pergunta_seguranca FROM usuario WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!rows[0].pergunta_seguranca) {
      return res.status(404).json({ error: 'Usuário não possui pergunta de segurança configurada.' });
    }

    return res.status(200).json({
      pergunta: rows[0].pergunta_seguranca
    });
  } catch (error) {
    next(error);
  }
}

export async function verificarRespostaSeguranca(req, res, next) {
  const { email, resposta } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();
  const normalizedResposta = resposta?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedResposta) {
    return res.status(400).json({ error: 'E-mail e resposta são obrigatórios.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id_usuario, resposta_seguranca FROM usuario WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const usuario = rows[0];
    if (!usuario.resposta_seguranca) {
      return res.status(400).json({ error: 'Usuário não possui pergunta de segurança cadastrada.' });
    }

    const respostaValida = await bcrypt.compare(normalizedResposta, usuario.resposta_seguranca);
    if (!respostaValida) {
      return res.status(401).json({ error: 'Resposta de segurança incorreta.' });
    }

    return res.status(200).json({
      valid: true,
      message: 'Resposta correta!'
    });
  } catch (error) {
    next(error);
  }
}

export async function redefinirSenha(req, res, next) {
  const { email, resposta, novaSenha } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();
  const normalizedResposta = resposta?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedResposta || !novaSenha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id_usuario, resposta_seguranca FROM usuario WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const usuario = rows[0];
    if (!usuario.resposta_seguranca) {
      return res.status(400).json({ error: 'Usuário não possui pergunta de segurança cadastrada.' });
    }

    const respostaValida = await bcrypt.compare(normalizedResposta, usuario.resposta_seguranca);
    if (!respostaValida) {
      return res.status(401).json({ error: 'Resposta de segurança incorreta.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query('UPDATE usuario SET senha = $1 WHERE id_usuario = $2', [
      novaSenhaHash,
      usuario.id_usuario
    ]);

    return res.status(200).json({
      message: 'Senha redefinida com sucesso!'
    });
  } catch (error) {
    next(error);
  }
}
