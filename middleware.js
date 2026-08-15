// Серверная защита панели управления.
// Работает на Vercel Edge — проверяет пароль ДО того, как отдать браузеру
// admin.html или js/admin.js. Пароль хранится в переменной окружения
// ADMIN_PANEL_PASSWORD (Vercel → Settings → Environment Variables), а не в коде,
// поэтому не виден никому в репозитории или в исходниках сайта.

export const config = {
  matcher: ['/admin.html', '/js/admin.js'],
};

const COOKIE_NAME = 'ptjk_admin_auth';

export default async function middleware(request) {
  const password = process.env.ADMIN_PANEL_PASSWORD;

  // Если переменная окружения ещё не настроена — не блокируем доступ,
  // чтобы случайно не запереть админку до того, как пароль будет задан.
  if (!password) return;

  const cookieHeader = request.headers.get('cookie') || '';
  const isAuthorized = cookieHeader
    .split(';')
    .some((part) => part.trim() === COOKIE_NAME + '=' + password);

  if (isAuthorized) return;

  const url = new URL(request.url);
  const submitted = url.searchParams.get('key');

  if (submitted === password) {
    const redirectUrl = new URL(url.pathname, url.origin);
    const response = new Response(null, {
      status: 302,
      headers: { Location: redirectUrl.toString() },
    });
    response.headers.append(
      'Set-Cookie',
      COOKIE_NAME + '=' + password + '; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax'
    );
    return response;
  }

  return new Response(gatePage(Boolean(submitted)), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function gatePage(wrong) {
  return '<!doctype html>' +
'<html lang="ru"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1">' +
'<title>Вход — President.tjk</title>' +
'<style>' +
'html{overflow-x:hidden;overflow-x:clip;}' +
'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0a08;color:#f3ead8;font-family:-apple-system,"Segoe UI",sans-serif;overflow-x:hidden;overflow-x:clip;}' +
'@supports (height: 100dvh){ body{ min-height: 100dvh; } }' +
'form{background:#1b160e;border:1px solid rgba(201,162,75,.2);padding:40px 32px;width:100%;max-width:320px;text-align:center;box-sizing:border-box;}' +
'h1{font-family:Georgia,serif;font-weight:400;font-size:22px;margin:0 0 20px;}' +
'input{width:100%;box-sizing:border-box;background:transparent;border:1px solid rgba(201,162,75,.2);color:#f3ead8;padding:12px 14px;font-size:14px;outline:none;margin-bottom:14px;}' +
'input:focus{border-color:#c9a24b;}' +
'button{width:100%;padding:12px;background:linear-gradient(135deg,#f2d98a,#c9a24b 60%,#8a6a28);border:none;color:#16130c;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:12px;cursor:pointer;}' +
'p.err{color:#e08a71;font-size:13px;margin:-6px 0 14px;}' +
'</style></head>' +
'<body>' +
'<form method="GET">' +
'<h1>Доступ к панели</h1>' +
(wrong ? '<p class="err">Неверный пароль</p>' : '') +
'<input type="password" name="key" placeholder="Пароль" autofocus required>' +
'<button type="submit">Войти</button>' +
'</form>' +
'</body></html>';
}
