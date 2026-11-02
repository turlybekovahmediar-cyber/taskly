import { readFile } from 'node:fs/promises';
import { pool, tx } from './db.js';
import { isMain } from './isMain.js';
import { adminEmails } from './auth.js';

export async function migrate() {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    const { seedDemo } = await import('./seed.js');
    await tx(seedDemo);
    console.log('База пустая — загружены демо-данные');
  }
  const admins = adminEmails();
  if (admins.length) await pool.query(`UPDATE users SET is_admin = true WHERE lower(email) = ANY($1) AND NOT is_admin`, [admins]);
}

if (isMain(import.meta.url)) {
  await migrate();
  console.log('Схема применена');
  await pool.end();
}
