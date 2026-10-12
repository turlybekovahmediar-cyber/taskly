/* true, если модуль запущен напрямую (node src/x.js), а не импортирован */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const isMain = (url) => !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(url);
