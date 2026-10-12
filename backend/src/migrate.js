import { readFile } from 'node:fs/promises';
import { pool, tx } from './db.js';
import { isMain } from './isMain.js';

export async function migrate() {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    const { seedDemo } = await import('./seed.js');
    await tx(seedDemo);
    console.log('База пустая — загружены демо-данные');
  }
}

if (isMain(import.meta.url)) {
  await migrate();
  console.log('Схема применена');
  await pool.end();
}
