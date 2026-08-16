// Корзина покупателя. Хранится в этом браузере (localStorage) и не связана
// с каталогом администратора — это отдельная, посетительская функция сайта.
(function () {
  const CART_KEY = 'presidentTjkCart';

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  function formatPrice(n) {
    return Number(n).toLocaleString('ru-RU');
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
  function mediaMarkup(p) {
    if (p.image) return '<img src="' + p.image + '" alt="">';
    const key = p.icon && ICONS[p.icon] ? p.icon : (CATEGORY_ICON[p.category] || 'watch-generic');
    return '<svg viewBox="0 0 100 100">' + ICONS[key] + '</svg>';
  }

  const cartBtn = document.getElementById('cartBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  const cartItemsEl = document.getElementById('cartItems');
  const cartFoot = document.getElementById('cartFoot');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const toast = document.getElementById('siteToast');

  if (!cartBtn || !cartOverlay) return;

  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function updateBadge() {
    const count = getCart().reduce((sum, item) => sum + item.qty, 0);
    if (count > 0) {
      cartBadge.textContent = count > 99 ? '99+' : String(count);
      cartBadge.hidden = false;
    } else {
      cartBadge.hidden = true;
    }
  }

  function addToCart(id) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id, qty: 1 });
    }
    saveCart(cart);
    updateBadge();
  }

  async function setQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) {
      cart = cart.filter((item) => item.id !== id);
    } else {
      const item = cart.find((x) => x.id === id);
      if (item) item.qty = qty;
    }
    saveCart(cart);
    updateBadge();
    await renderCart();
  }

  async function removeFromCart(id) {
    saveCart(getCart().filter((item) => item.id !== id));
    updateBadge();
    await renderCart();
  }

  async function renderCart() {
    const cart = getCart();
    const products = await getProducts();
    const rows = cart
      .map((item) => ({ item, product: products.find((p) => p.id === item.id) }))
      .filter((x) => x.product);

    if (!rows.length) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Ваша корзина пуста.<br>Добавьте что-нибудь из каталога.</p>';
      cartFoot.hidden = true;
      return;
    }

    let total = 0;
    cartItemsEl.innerHTML = rows.map(({ item, product }) => {
      const lineTotal = product.price * item.qty;
      total += lineTotal;
      return (
        '<div class="cart-row" data-id="' + product.id + '">' +
          '<div class="thumb">' + mediaMarkup(product) + '</div>' +
          '<div class="info">' +
            '<span class="name">' + escapeHtml(product.name) + '</span>' +
            '<span class="unit-price">' + formatPrice(product.price) + ' TJS</span>' +
            '<div class="qty-row">' +
              '<button class="qty-btn qty-minus" type="button" aria-label="Меньше">−</button>' +
              '<span class="qty-value">' + item.qty + '</span>' +
              '<button class="qty-btn qty-plus" type="button" aria-label="Больше">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="cart-row-end">' +
            '<button class="remove-btn" type="button" aria-label="Убрать из корзины"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7"/></svg></button>' +
            '<span class="line-total">' + formatPrice(lineTotal) + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    cartTotalEl.textContent = formatPrice(total) + ' TJS';
    cartFoot.hidden = false;
  }

  cartItemsEl.addEventListener('click', (e) => {
    const row = e.target.closest('.cart-row');
    if (!row) return;
    const id = row.dataset.id;
    const cart = getCart();
    const item = cart.find((x) => x.id === id);
    if (!item) return;

    if (e.target.closest('.qty-plus')) setQty(id, item.qty + 1);
    else if (e.target.closest('.qty-minus')) setQty(id, item.qty - 1);
    else if (e.target.closest('.remove-btn')) removeFromCart(id);
  });

  async function openCart() {
    window.closeMobileNav?.();
    cartOverlay.classList.add('is-open');
    window.syncScrollLock?.();
    await renderCart();
  }
  function closeCart() {
    cartOverlay.classList.remove('is-open');
    window.syncScrollLock?.();
  }
  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) closeCart(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cartOverlay.classList.contains('is-open')) closeCart(); });

  // Добавление в корзину с карточки товара (делегирование — карточки рендерятся динамически)
  document.getElementById('productsGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    const card = btn.closest('.product-card');
    if (!card) return;
    addToCart(card.dataset.id);
    showToast('Добавлено в корзину');
    btn.classList.add('is-added');
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4 4L19 7"/></svg>';
    setTimeout(() => {
      btn.classList.remove('is-added');
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
    }, 1000);
  });

  // Оформление заказа: собираем текст, копируем в буфер и открываем Telegram
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* игнорируем — просто откроем чат */ }
    document.body.removeChild(ta);
  }

  checkoutBtn.addEventListener('click', async () => {
    const cart = getCart();
    if (!cart.length) return;

    // Открываем вкладку сразу, синхронно с кликом, ДО каких-либо await —
    // иначе Safari и другие браузеры блокируют её как всплывающее окно.
    window.open('https://t.me/+992885444442', '_blank', 'noopener');

    const products = await getProducts();
    const rows = cart
      .map((item) => ({ item, product: products.find((p) => p.id === item.id) }))
      .filter((x) => x.product);
    if (!rows.length) return;

    let total = 0;
    const lines = rows.map(({ item, product }) => {
      const lineTotal = product.price * item.qty;
      total += lineTotal;
      return '— ' + product.name + ' × ' + item.qty + ' — ' + formatPrice(lineTotal) + ' TJS';
    });
    const message = 'Здравствуйте! Хочу оформить заказ на President.tjk:\n' + lines.join('\n') + '\n\nИтого: ' + formatPrice(total) + ' TJS';

    copyText(message).then(() => {
      showToast('Текст заказа скопирован — вставьте его в чат');
    });
  });

  updateBadge();
})();
