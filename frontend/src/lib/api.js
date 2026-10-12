/* Запросы к бэкенду. Вход хранится в httpOnly-cookie, поэтому токен здесь не нужен. */
export async function api(method, path, body) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.'), { status: 0 });
  }
  let data = null;
  try { data = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok) {
    const msg = data?.error || (res.status >= 500 ? 'Сервер временно недоступен. Попробуйте ещё раз.' : 'Не удалось выполнить действие');
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return data;
}
