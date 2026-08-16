// Подпись загрузки для Cloudinary.
// Секретный ключ (CLOUDINARY_API_SECRET) никогда не покидает сервер —
// сюда админка присылает, ЧТО она хочет загрузить, а в ответ получает
// одноразовую подпись, с которой браузер уже сам грузит файл напрямую
// в Cloudinary. Доступно только с той же сессией, что прошла защиту
// в middleware.js (тот же логин/пароль администратора).

export const config = { runtime: 'edge' };

const COOKIE_NAME = 'ptjk_admin_auth';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const password = process.env.ADMIN_PANEL_PASSWORD;
  const login = process.env.ADMIN_PANEL_LOGIN || 'admin';
  if (password) {
    const authToken = login + ':' + password;
    const cookieHeader = request.headers.get('cookie') || '';
    const authorized = cookieHeader
      .split(';')
      .some((part) => part.trim() === COOKIE_NAME + '=' + authToken);
    if (!authorized) return json({ error: 'Unauthorized' }, 401);
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 's2yi4ma6';
  if (!apiKey || !apiSecret) {
    return json({ error: 'Cloudinary is not configured' }, 500);
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // пустое тело — просто подпишем один timestamp
  }
  const extraParams = (body && typeof body.params === 'object' && body.params) || {};

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { ...extraParams, timestamp };

  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => key + '=' + paramsToSign[key])
    .join('&');

  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign + apiSecret));
  const signature = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return json({ signature, timestamp, apiKey, cloudName });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json' },
  });
}
