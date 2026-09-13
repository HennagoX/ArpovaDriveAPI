import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { validate } from './src/middlewares/validate.js';

const app = express();
const port = 3000;

const userSchema = z.object({
    email: z.string().trim().email('Por favor, insira um email válido')
});

const origensPermitidas = [
    'http://localhost:3000',
    'http://127.0.0.1:5500'
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

app.post('/users', validate(userSchema), (req, res) =>{
    const email = req.body.email;

    res.status(200).json({
        "isAuthenticated" : true,
        "email" : email
    }) 
})

app.listen(port, () => {
    console.log('app listening on port ' + port);
})
