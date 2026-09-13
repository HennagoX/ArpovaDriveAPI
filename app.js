import express from 'express';
import cors from 'cors';
import zod from 'zod';

const app = express()

const port = 3000;

const origiensPermitidas = [
    'http://localhost:3000',
    'http://127.0.0.1:5500'
]

app.use(cors({
    origin: function(origin, callback){
        if (!origin || origiensPermitidas.indexOf(origin) !== -1){
            callback(null, true)
        }
        else
        {
            callback(new Error('Bloqueado pelo CORS: Esta origim não é permitida.'));
        }
    }
}))

app.use(express.json());

const myValidation = function(req, res, next){
    if (req.body && typeof req.body.number === 'number') {
        if (req.body.number >= 10) {
            console.log("Número muito alto!");
            next();
        } else {
            res.status(400).json({ erro: "O número deve ser maior ou igual a 10" });
        }
    } else {
        res.status(400).json({ erro: "Por favor, envie um número válido." });
    }
}

app.get("/", (req, res) =>{
    res.send(JSON.stringify('Hello World'));
})

app.post('/users', myValidation, (req, res) =>{
    const email = req.query.email || "";
    res.status(200).json({
        "isAuthenticated" : true,
        "email" : email
    }) 
})

app.listen(port, () => {
    console.log('Example app listening on port ' + port);
})
