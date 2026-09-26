import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max:20,
  min:2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 6000,
  keepAliveInitialDelayMillis: 10000,
  keepAlive: true,
});

pool.on('error', (err) => {
  console.error('Unexpected error in the idle PostgreSQL client pool:', err);
});

export default pool;