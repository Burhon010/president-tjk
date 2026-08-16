// Общие данные и утилиты каталога товаров.
// Используются и витриной (index.html), и панелью управления (admin.html).
// Сам каталог хранится в Cloudinary (один общий JSON-файл) — поэтому он
// одинаковый на любом устройстве и у любого посетителя, а не только
// в браузере, где его редактировали.

const CLOUDINARY_CLOUD_NAME = 's2yi4ma6';

// Наборы штрихов для карточек без своего фото — один узнаваемый значок на категорию,
// плюс несколько «фирменных» вариантов для товаров из стартового каталога.
const ICONS = {
  chrono: '<circle cx="50" cy="50" r="34" fill="none" stroke="var(--gold)" stroke-width="2.5"/><circle cx="50" cy="50" r="27" fill="none" stroke="var(--gold-deep)" stroke-width="1"/><path d="M50 50V27M50 50l16 10" stroke="var(--gold-bright)" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="50" r="2.4" fill="var(--gold-bright)"/>',
  skeleton: '<rect x="26" y="26" width="48" height="48" rx="2" fill="none" stroke="var(--gold)" stroke-width="2.5" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="16" fill="none" stroke="var(--gold-deep)" stroke-width="1"/><circle cx="50" cy="50" r="2.4" fill="var(--gold-bright)"/>',
  diamond: '<circle cx="50" cy="50" r="34" fill="none" stroke="var(--gold)" stroke-width="2.5"/><g fill="var(--gold-bright)"><circle cx="50" cy="20" r="2"/><circle cx="72" cy="35" r="2"/><circle cx="72" cy="65" r="2"/><circle cx="50" cy="80" r="2"/><circle cx="28" cy="65" r="2"/><circle cx="28" cy="35" r="2"/></g><path d="M50 50V30M50 50l14 8" stroke="var(--gold-bright)" stroke-width="2" stroke-linecap="round"/>',
  tote: '<path d="M32 40 Q32 26 50 26 Q68 26 68 40" fill="none" stroke="var(--gold-deep)" stroke-width="2.5"/><rect x="24" y="40" width="52" height="38" rx="3" fill="none" stroke="var(--gold)" stroke-width="2.5"/><path d="M40 55l6 6 14-14" stroke="var(--gold-bright)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  clutch: '<rect x="20" y="46" width="60" height="30" rx="4" fill="none" stroke="var(--gold)" stroke-width="2.5"/><path d="M34 46v-8a4 4 0 014-4h24a4 4 0 014 4v8" fill="none" stroke="var(--gold-deep)" stroke-width="2.5"/><circle cx="50" cy="61" r="4" fill="none" stroke="var(--gold-bright)" stroke-width="1.6"/>',
  bust: '<path d="M50 22c10 10 16 20 16 30a16 16 0 01-32 0c0-10 6-20 16-30z" fill="none" stroke="var(--gold)" stroke-width="2.5"/><rect x="40" y="72" width="20" height="6" fill="none" stroke="var(--gold-deep)" stroke-width="2"/>',
};
ICONS['watch-generic'] = ICONS.chrono;
ICONS['bag-generic'] = ICONS.tote;
ICONS['souvenir-generic'] = ICONS.diamond;

const CATEGORY_ICON = {
  'Часы': 'watch-generic',
  'Сумки': 'bag-generic',
  'Сувениры': 'souvenir-generic',
};

// Какие значки допустимы для какой категории — используется при смене категории
// товара в админке, чтобы не остался значок часов у карточки, ставшей сумкой.
const ICONS_BY_CATEGORY = {
  'Часы': ['chrono', 'skeleton', 'diamond', 'watch-generic'],
  'Сумки': ['tote', 'clutch', 'bag-generic'],
  'Сувениры': ['bust', 'souvenir-generic'],
};

const DEFAULT_PRODUCTS = [
  { id: 'p1', category: 'Часы', name: 'President Somoni Chronograph', price: 42500, badge: 'Limited', icon: 'chrono', image: '', description: 'Швейцарский механизм в корпусе из золота 18К, гравировка герба на заднике.' },
  { id: 'p2', category: 'Часы', name: 'Pamir Skeleton', price: 38900, badge: '', icon: 'skeleton', image: '', description: 'Открытый скелетон-механизм в титановом корпусе — точность без прикрас.' },
  { id: 'p3', category: 'Часы', name: 'Regal Imperial Diamond', price: 67200, badge: 'Новинка', icon: 'diamond', image: '', description: 'Бриллиантовый безель и сапфировое стекло — для особых случаев.' },
  { id: 'p4', category: 'Сумки', name: 'Regalia Tote', price: 12400, badge: '', icon: 'tote', image: '', description: 'Телячья кожа ручной выделки с тиснёной звездой President.' },
  { id: 'p5', category: 'Сумки', name: 'Dushanbe Clutch', price: 9800, badge: '', icon: 'clutch', image: '', description: 'Компактный клатч из крокодиловой кожи с золотой фурнитурой.' },
  { id: 'p6', category: 'Сувениры', name: 'Бюст Исмоили Сомони', price: 3200, badge: 'Коллекц.', icon: 'bust', image: '', description: 'Коллекционная миниатюра, бронза с позолотой, пронумерована.' },
];

// Читает актуальный каталог через /api/catalog (см. api/catalog.js) — этот
// сервер сам ходит в Cloudinary в обход кэширующей сети, поэтому здесь
// всегда самая свежая версия, без риска увидеть только что удалённый
// товар снова. Пока админка ни разу не сохраняла товары, каталога ещё
// нет — тогда показываем стартовый набор из шести товаров.
// Важно: пустой каталог (все товары удалили нарочно) — это тоже
// допустимое, настоящее состояние, а не повод подставлять набор по
// умолчанию.
async function getProducts() {
  try {
    const res = await fetch('/api/catalog', { cache: 'no-store' });
    if (!res.ok) return DEFAULT_PRODUCTS.slice();
    const list = await res.json();
    if (list === null) return DEFAULT_PRODUCTS.slice();
    return Array.isArray(list) ? list : DEFAULT_PRODUCTS.slice();
  } catch (e) {
    return DEFAULT_PRODUCTS.slice();
  }
}
