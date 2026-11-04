import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do pool de conexões com o PostgreSQL
const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${encodeURIComponent(process.env.PGPASSWORD || '')}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'prazojus'}`;

export const pool = new Pool({
  connectionString,
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
