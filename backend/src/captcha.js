import { fail } from './http.js';
import { securityEvent } from './log.js';
import { captchaSiteKey } from './config.js';


export async function verifyCaptcha(req, token, action) {
  if (!captchaSiteKey()) return;
  if (!token) {
    securityEvent(req, 'captcha_missing', { action });
    fail(400, 'Не удалось проверить, что вы не робот. Обновите страницу и попробуйте ещё раз.');
  }
  let data;
  try {
    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: token, remoteip: req.ip }),
      signal: AbortSignal.timeout(5000),
    });
    data = await r.json();
  } catch {
    fail(503, 'Проверка на робота временно недоступна. Попробуйте через минуту.');
  }
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
  if (!data.success || (data.action && data.action !== action) || (data.score ?? 0) < minScore) {
    securityEvent(req, 'captcha_failed', { action, score: data.score ?? null, errors: data['error-codes'] ?? [] });
    fail(400, 'Проверка на робота не пройдена. Если вы человек — попробуйте ещё раз.');
  }
}
