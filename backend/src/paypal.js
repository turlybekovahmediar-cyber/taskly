import { kztPerUsd } from './config.js';

const base = () => (process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
let cached = { token: null, expires: 0 };

export class PayPalError extends Error {
  constructor(message, status, details) { super(message); this.status = status; this.details = details; }
  get issue() { return this.details?.details?.[0]?.issue || null; }
}

async function accessToken() {
  if (cached.token && Date.now() < cached.expires) return cached.token;
  const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString('base64');
  const r = await fetch(base() + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.access_token) throw new PayPalError('PayPal: не удалось авторизоваться — проверьте PAYPAL_CLIENT_ID и PAYPAL_CLIENT_SECRET', r.status, data);
  cached = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cached.token;
}

async function api(method, path, body, requestId) {
  const headers = { Authorization: 'Bearer ' + (await accessToken()), 'Content-Type': 'application/json', Prefer: 'return=representation' };
  if (requestId) headers['PayPal-Request-Id'] = requestId;
  const r = await fetch(base() + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new PayPalError(data.message || 'PayPal вернул ошибку ' + r.status, r.status, data);
  return data;
}

export const kztToUsd = (kzt) => Math.max(1, Math.round((kzt / kztPerUsd()) * 100) / 100);

export async function createOrder({ referenceId, usd, description, returnUrl, cancelUrl, requestId }) {
  const order = await api('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: referenceId,
      custom_id: referenceId,
      description: description.slice(0, 127),
      amount: { currency_code: 'USD', value: usd.toFixed(2) },
    }],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'Taskly',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
    },
  }, requestId);
  const link = order.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  if (!link) throw new PayPalError('PayPal не вернул ссылку на оплату', 502, order);
  return { orderId: order.id, approveUrl: link.href };
}

const captureOf = (order) => order.purchase_units?.[0]?.payments?.captures?.[0] || null;

export async function captureOrder(orderId, requestId) {
  try {
    const order = await api('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, requestId);
    const c = captureOf(order);
    return { completed: order.status === 'COMPLETED' && c?.status === 'COMPLETED', captureId: c?.id || null, status: c?.status || order.status };
  } catch (e) {
    if (e instanceof PayPalError && e.issue === 'ORDER_ALREADY_CAPTURED') {
      const order = await api('GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      const c = captureOf(order);
      return { completed: c?.status === 'COMPLETED', captureId: c?.id || null, status: c?.status || order.status };
    }
    throw e;
  }
}

export const refundCapture = (captureId, requestId) =>
  api('POST', `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {}, requestId);

export async function verifyWebhook(req) {
  if (!process.env.PAYPAL_WEBHOOK_ID) return false;
  const h = (k) => req.get(k);
  const data = await api('POST', '/v1/notifications/verify-webhook-signature', {
    auth_algo: h('paypal-auth-algo'),
    cert_url: h('paypal-cert-url'),
    transmission_id: h('paypal-transmission-id'),
    transmission_sig: h('paypal-transmission-sig'),
    transmission_time: h('paypal-transmission-time'),
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: req.body,
  });
  return data.verification_status === 'SUCCESS';
}
