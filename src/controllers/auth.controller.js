import bcrypt from 'bcrypt';
import pool from '../Repositories/db.js';

export async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const passwordValid = await bcrypt.compare(password, user.senha);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user.id_usuario,
        name: user.nome,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  const { name, email, password, birthDate, data_nascimento } = req.body;
  const normalizedBirthDate = birthDate || data_nascimento;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO usuario(nome, email, senha, data_nascimento)
      VALUES($1, $2, $3, $4)
      RETURNING id_usuario, nome, email;
    `;

    const { rows } = await pool.query(query, [name, email, passwordHash, normalizedBirthDate]);

    return res.status(201).json({
      message: 'User registered successfully!',
      user: rows[0]
    });
  } catch (error) {
    next(error);
  }
}
