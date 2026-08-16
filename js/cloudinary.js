// Загрузка файлов в Cloudinary — используется только в админке (для
// витрины эти функции не нужны, она лишь читает уже сохранённые данные).
// Подпись берётся с /api/cloudinary-sign, сам файл после этого идёт
// напрямую в Cloudinary, минуя наш сервер.

async function getUploadSignature(params) {
  const res = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ params }),
  });
  if (!res.ok) {
    throw new Error('Не удалось подписать загрузку (' + res.status + ')');
  }
  return res.json();
}

async function uploadToCloudinary(fileOrBlob, opts) {
  opts = opts || {};
  const resourceType = opts.resourceType || 'image';

  const paramsToSign = {};
  if (opts.folder) paramsToSign.folder = opts.folder;
  if (opts.publicId) paramsToSign.public_id = opts.publicId;
  if (opts.overwrite) paramsToSign.overwrite = opts.overwrite;
  if (opts.invalidate) paramsToSign.invalidate = opts.invalidate;

  const { signature, timestamp, apiKey, cloudName } = await getUploadSignature(paramsToSign);

  const form = new FormData();
  form.append('file', fileOrBlob, opts.filename || 'upload');
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  Object.keys(paramsToSign).forEach((key) => form.append(key, paramsToSign[key]));

  const uploadRes = await fetch('https://api.cloudinary.com/v1_1/' + cloudName + '/' + resourceType + '/upload', {
    method: 'POST',
    body: form,
  });
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error('Cloudinary отклонил загрузку: ' + errText);
  }
  return uploadRes.json();
}

// Сохраняет весь каталог товаров как один JSON-файл в Cloudinary —
// перезаписывает один и тот же файл при каждом сохранении, поэтому
// у каталога всегда один и тот же адрес для чтения.
async function saveProducts(list) {
  const blob = new Blob([JSON.stringify(list)], { type: 'application/json' });
  await uploadToCloudinary(blob, {
    resourceType: 'raw',
    folder: 'president-tjk',
    publicId: 'catalog',
    overwrite: 'true',
    invalidate: 'true',
    filename: 'catalog.json',
  });
}
