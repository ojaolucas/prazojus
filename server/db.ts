import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Extração robusta para evitar problemas com caracteres especiais (como @ na senha)
let poolConfig: any;

if (process.env.PGHOST) {
  poolConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'prazojus',
  };
} else if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
  };
} else {
  poolConfig = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'prazojus',
  };
}

export const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Erro inesperado no pool de conexões:', err);
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('[PostgreSQL] Conexão bem-sucedida com o banco:', res.rows[0].now);
    return true;
  } catch (err) {
    console.warn('[PostgreSQL] Não foi possível conectar ao banco de dados:', (err as Error).message);
    return false;
  }
};
