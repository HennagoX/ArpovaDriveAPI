import bcrypt from 'bcrypt';
import pool from '../Repositories/db.js';

export async function login(req, res, next) {
  const { email, senha } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  const { nome, email, senha, data_nascimento } = req.body;

  try {
    const senhaHash = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuario(nome, email, senha, data_nascimento)
      VALUES($1, $2, $3, $4)
      RETURNING id_usuario, nome, email;
    `;

    const { rows } = await pool.query(query, [nome, email, senhaHash, data_nascimento]);

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      usuario: rows[0]
    });
  } catch (error) {
    next(error);
  }

}
