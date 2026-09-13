import express from 'express';
import cors from 'cors';
import { success, z } from 'zod';
import { validate } from './src/middlewares/validate.js';
import pool from "./src/Repositories/db.js";
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';

const app = express();

const limitadorGeral = rateLimit({
    windowMs: 14 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders : false,
    message: { error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.' },
    skip: (req) => req.method === 'OPTIONS',
    message: { error: 'Muitas tentativas. Aguarde alguns minutos.' }
})

const limitadorAuth = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10,
    skip: (req) => req.method === 'OPTIONS',
    message: { error: 'Muitas tentativas. Aguarde alguns minutos.' }
});

const PORT = process.env.PORT || 3000;
const userSchema = z.object({
    email: z.string().trim().email('Por favor, insira um email válido')
});

const origensPermitidas = [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'https://aprova-drive.vercel.app'
];

app.use(cors({
    origin: function(origin, callback){
        if (!origin || origensPermitidas.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado pelo CORS: Esta origem não é permitida.'));
        }
    }
}));


app.use(express.json());

//app.use(limitadorGeral)


app.post('/login', async (req, res) => {
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
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.post('/cadastro', validate(userSchema), async (req, res) =>{
    const { nome, email, senha, data_nascimento } = req.body;
    try{

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);
        
        const query = 
        `INSERT INTO usuario(nome, email, senha, data_nascimento)
        VALUES($1, $2, $3, $4)
        RETURNING id_usuario, nome, email;
        `;
        const values = [nome, email, senhaHash, data_nascimento];

        const {rows} = await pool.query(query, values);
       return res.status(201).json(rows[0]);
    }
    catch(error){
   if (error.code === '23505') {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
    
})

app.listen(PORT, () => {
    console.log('app listening on port ' + PORT);
})
