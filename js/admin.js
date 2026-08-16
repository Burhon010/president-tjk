// Логика панели управления товарами.
// Отдельного входа внутри самой панели больше нет — доступ к этой странице
// уже проверен на сервере (см. middleware.js), поэтому здесь сразу открыт
// весь функционал. Сам каталог и фото хранятся в Cloudinary (см.
// products-data.js и cloudinary.js) — изменения видны сразу всем,
// на любом устройстве.

const tbody = document.getElementById('productTbody');
const countEl = document.getElementById('productCount');
const emptyState = document.getElementById('emptyState');
const overlay = document.getElementById('formOverlay');
const formTitle = document.getElementById('formTitle');
const productForm = document.getElementById('productForm');
const catInput = document.getElementById('catInput');
const nameInput = document.getElementById('nameInput');
const priceInput = document.getElementById('priceInput');
const descInput = document.getElementById('descInput');
const photoInput = document.getElementById('photoInput');
const photoDrop = document.getElementById('photoDrop');
const photoPreview = document.getElementById('photoPreview');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const toast = document.getElementById('toast');

const editIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
const trashIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7"/></svg>';

let editingId = null;
let currentImageUrl = '';      // Cloudinary-адрес текущего фото (или пустая строка)
let pendingUpload = null;      // Promise загрузки нового фото, пока она не завершилась

// ---------- Фильтр по категориям ----------
const filterTabs = document.getElementById('filterTabs');
filterTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-tab');
  if (!btn) return;
  activeCategory = btn.dataset.cat;
  filterTabs.querySelectorAll('.filter-tab').forEach((b) => b.classList.toggle('is-active', b === btn));
  renderTable();
});

// ---------- Таблица ----------
function formatPrice(n) {
  return Number(n).toLocaleString('ru-RU');
}

function thumbMarkup(p) {
  if (p.image) return '<img src="' + p.image + '" alt="">';
  const key = p.icon && ICONS[p.icon] ? p.icon : (CATEGORY_ICON[p.category] || 'watch-generic');
  return '<svg viewBox="0 0 100 100">' + ICONS[key] + '</svg>';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1).trimEnd() + '…' : str;
}

function pluralize(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'товара';
  return 'товаров';
}

let activeCategory = '';

async function renderTable() {
  const all = await getProducts();
  const products = activeCategory ? all.filter((p) => p.category === activeCategory) : all;

  countEl.textContent = activeCategory
    ? products.length + ' ' + pluralize(products.length) + ' в категории «' + activeCategory + '»'
    : products.length + ' ' + pluralize(products.length) + ' в каталоге';

  if (!products.length) {
    tbody.innerHTML = '';
    emptyState.textContent = activeCategory
      ? 'В категории «' + activeCategory + '» пока нет товаров.'
      : 'Каталог пуст. Добавьте первый товар.';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tbody.innerHTML = products.map((p) => (
    '<tr data-id="' + p.id + '">' +
      '<td class="cell-name"><div class="row-name"><div class="row-thumb">' + thumbMarkup(p) + '</div><span class="title">' + escapeHtml(p.name) + '</span></div></td>' +
      '<td data-label="Категория"><span class="pill">' + p.category + '</span></td>' +
      '<td class="row-price" data-label="Цена">' + formatPrice(p.price) + ' TJS</td>' +
      '<td class="row-desc" data-label="Описание">' + (p.description ? escapeHtml(truncate(p.description, 60)) : '—') + '</td>' +
      '<td class="cell-actions"><div class="row-actions">' +
        '<button class="icon-action edit-btn" title="Редактировать" aria-label="Редактировать">' + editIconSvg + '</button>' +
        '<button class="icon-action danger delete-btn" title="Удалить" aria-label="Удалить">' + trashIconSvg + '</button>' +
      '</div></td>' +
    '</tr>'
  )).join('');
}

tbody.addEventListener('click', async (e) => {
  const row = e.target.closest('tr');
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.closest('.edit-btn')) {
    const products = await getProducts();
    const p = products.find((x) => x.id === id);
    if (p) openForm(p);
  } else if (e.target.closest('.delete-btn')) {
    if (confirm('Удалить этот товар из каталога?')) {
      const products = await getProducts();
      await saveProducts(products.filter((x) => x.id !== id));
      await renderTable();
      showToast('Товар удалён');
    }
  }
});

// ---------- Форма добавления/редактирования ----------
document.getElementById('addBtn').addEventListener('click', () => openForm(null));
document.getElementById('cancelFormBtn').addEventListener('click', closeForm);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeForm(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeForm(); });

function openForm(product) {
  editingId = product ? product.id : null;
  formTitle.textContent = product ? 'Редактировать товар' : 'Новый товар';
  catInput.value = product ? product.category : (activeCategory || 'Часы');
  nameInput.value = product ? product.name : '';
  priceInput.value = product ? product.price : '';
  descInput.value = product ? (product.description || '') : '';
  currentImageUrl = product ? (product.image || '') : '';
  pendingUpload = null;
  updatePhotoPreview();
  overlay.classList.add('is-open');
  setTimeout(() => nameInput.focus(), 150);
}

function closeForm() {
  overlay.classList.remove('is-open');
  photoInput.value = '';
}

function updatePhotoPreview() {
  if (currentImageUrl) {
    photoPreview.src = currentImageUrl;
    photoPreview.style.display = 'block';
    photoPlaceholder.style.display = 'none';
  } else {
    photoPreview.style.display = 'none';
    photoPlaceholder.style.display = 'block';
  }
}

photoDrop.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      // Универсальный формат для всех фото товара: квадрат 1200×1200 —
      // берём центральную квадратную часть исходника (какого бы размера
      // и пропорций он ни был) и приводим ровно к 1200×1200. Работает
      // одинаково что на телефоне, что на компьютере — это просто холст
      // в браузере, а не что-то зависящее от устройства.
      const SIZE = 1200;
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);

      // Мгновенный локальный превью, пока фото грузится в Cloudinary
      photoPreview.src = canvas.toDataURL('image/jpeg', 0.82);
      photoPreview.style.display = 'block';
      photoPlaceholder.style.display = 'none';

      canvas.toBlob((blob) => {
        pendingUpload = uploadToCloudinary(blob, {
          folder: 'president-tjk/products',
          resourceType: 'image',
        }).then((res) => {
          currentImageUrl = res.secure_url;
          pendingUpload = null;
          return res.secure_url;
        }).catch((err) => {
          pendingUpload = null;
          showToast('Не удалось загрузить фото — попробуйте ещё раз');
          throw err;
        });
      }, 'image/jpeg', 0.82);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);

  if (!name) { showToast('Укажите название товара'); return; }
  if (!price || price <= 0) { showToast('Укажите цену товара'); return; }

  if (pendingUpload) {
    showToast('Подождите, фото ещё загружается…');
    try {
      await pendingUpload;
    } catch (err) {
      return; // сообщение об ошибке уже показано в обработчике загрузки
    }
  }

  const description = descInput.value.trim();
  const products = await getProducts();

  if (editingId) {
    const idx = products.findIndex((p) => p.id === editingId);
    if (idx > -1) {
      const prev = products[idx];
      const category = catInput.value;
      // Значок-заглушка остаётся прежним, только если он всё ещё уместен для
      // новой категории (иначе после смены категории виден чужой значок).
      const iconStillFits = (ICONS_BY_CATEGORY[category] || []).includes(prev.icon);
      const icon = iconStillFits ? prev.icon : CATEGORY_ICON[category];
      products[idx] = { ...prev, category, name, price, description, icon, image: currentImageUrl };
    }
  } else {
    products.push({
      id: 'p' + Date.now(),
      category: catInput.value,
      name,
      price,
      badge: '',
      description,
      icon: CATEGORY_ICON[catInput.value],
      image: currentImageUrl,
    });
  }

  await saveProducts(products);
  closeForm();
  await renderTable();
  showToast(editingId ? 'Товар обновлён' : 'Товар добавлен');
});

// ---------- Уведомление ----------
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

renderTable();
