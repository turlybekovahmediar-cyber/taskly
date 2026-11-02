export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const captchaSiteKey = () => (process.env.RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY ? process.env.RECAPTCHA_SITE_KEY : null);
export const paypalEnabled = () => !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
export const kztPerUsd = () => Number(process.env.PAYPAL_KZT_PER_USD) || 500;
