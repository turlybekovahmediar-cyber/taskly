/* Подключение к PostgreSQL. query — одиночный запрос, tx — транзакция. */
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

/* backend/.env — локально; на хостинге переменные задаются в панели */
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

if (!process.env.DATABASE_URL) {
  console.error('Не задан DATABASE_URL — см. backend/.env.example');
  process.exit(1);
}

/* date → строка YYYY-MM-DD, без сдвига часового пояса */
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

export const query = (text, params) => pool.query(text, params);

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
