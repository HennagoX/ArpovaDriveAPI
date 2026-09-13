import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const Pool = pkg.Pool;

if (!process.env.DATABASE_URL){
    process.exit(1);
}
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 6000, 
  keepAlive: true 
    
})

pool.connect((err, client, release) =>{
    if (err) {
        return console.error('Erro ao conectar no Neon PostgreSQL:', err.stack);
    }
    console.log('Conectado com sucesso ao Neon PostgreSQL!');
})

export default pool;