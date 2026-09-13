import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { validate } from './src/middlewares/validate.js';
import pool from "./src/Repositories/db.js";
import bcrypt from 'bcrypt';

const app = express();
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

app.post('/usuarios', validate(userSchema), async (req, res) =>{
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
