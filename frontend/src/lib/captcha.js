let loading = null;

function load(siteKey) {
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(siteKey);
      s.async = true;
      s.onload = () => window.grecaptcha.ready(resolve);
      s.onerror = () => { loading = null; reject(new Error('Не удалось загрузить проверку на робота. Проверьте интернет.')); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export const preloadCaptcha = (siteKey) => { if (siteKey) load(siteKey).catch(() => {}); };

export async function captchaToken(siteKey, action) {
  if (!siteKey) return undefined;
  await load(siteKey);
  return window.grecaptcha.execute(siteKey, { action });
}
