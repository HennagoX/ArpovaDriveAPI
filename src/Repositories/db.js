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

pool.on('error', (err, client) => {
  console.error('Erro inesperado em cliente ocioso no Pool do Postgres:', err);

});
export default pool;