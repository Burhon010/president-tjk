// Публичное чтение каталога товаров.
// Раньше витрина и админка читали файл каталога напрямую по прямой ссылке
// Cloudinary — но такая ссылка отдаётся через кэширующую CDN-сеть, и после
// каждого сохранения кэш на разных узлах обновлялся не сразу (иногда с
// заметной задержкой). Из-за этого товар, который только что удалили,
// мог на следующей же перезагрузке снова появиться — читалась старая
// закэшированная версия файла.
//
// Здесь вместо этого сначала спрашиваем у Cloudinary через Admin API,
// какая версия файла сейчас самая свежая (этот запрос идёт напрямую,
// мимо кэширующей сети), а затем читаем файл по ссылке с номером именно
// этой версии. Номер версии меняется при каждом сохранении, поэтому такая
// ссылка каждый раз новая и никогда не может вернуть устаревшее содержимое.
export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 's2yi4ma6';

  if (!apiKey || !apiSecret) {
    return json(null, 200); // не настроено — вызывающий код покажет каталог по умолчанию
  }

  try {
    const infoRes = await fetch(
      'https://api.cloudinary.com/v1_1/' + cloudName + '/resources/raw/upload/president-tjk/catalog.json',
      { headers: { Authorization: 'Basic ' + btoa(apiKey + ':' + apiSecret) } }
    );

    if (infoRes.status === 404) {
      return json(null, 200); // каталог ещё ни разу не сохранялся — покажем набор по умолчанию
    }
    if (!infoRes.ok) {
      return json({ error: 'Cloudinary lookup failed' }, 502);
    }

    const info = await infoRes.json();
    const fileUrl = 'https://res.cloudinary.com/' + cloudName + '/raw/upload/v' + info.version + '/president-tjk/catalog.json';
    const fileRes = await fetch(fileUrl, { cache: 'no-store' });
    if (!fileRes.ok) return json({ error: 'Catalog fetch failed' }, 502);

    const list = await fileRes.json();
    return json(list, 200);
  } catch (e) {
    return json({ error: 'Unexpected error' }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
