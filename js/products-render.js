// Рендер сетки товаров на витрине из каталога (localStorage).
// Выполняется синхронно при загрузке страницы, до того как main.js
// настраивает scroll-reveal — поэтому новые карточки тоже красиво появляются.
(function () {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  function formatPrice(n) {
    return Number(n).toLocaleString('ru-RU');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function badgeMarkup(badge) {
    if (!badge) return '';
    return '<span class="badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.8H21l-5.6 4 2.1 6.8L12 15.6 6.5 19.6l2.1-6.8L3 8.8h6.8z"/></svg>' + badge + '</span>';
  }

  function mediaMarkup(p) {
    if (p.image) {
      return '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '">';
    }
    const key = p.icon && ICONS[p.icon] ? p.icon : (CATEGORY_ICON[p.category] || 'watch-generic');
    return '<svg viewBox="0 0 100 100">' + ICONS[key] + '</svg>';
  }

  function descMarkup(p) {
    if (!p.description) return '';
    return '<p class="product-desc">' + escapeHtml(p.description) + '</p>';
  }

  function cardMarkup(p, i) {
    return '' +
      '<article class="product-card" id="product-' + p.id + '" data-id="' + p.id + '" data-reveal style="transition-delay:' + ((i % 3) * 0.06) + 's">' +
        '<div class="product-media">' + badgeMarkup(p.badge) + mediaMarkup(p) + '</div>' +
        '<div class="product-body">' +
          '<p class="product-cat">' + p.category + '</p>' +
          '<h3 class="product-name">' + escapeHtml(p.name) + '</h3>' +
          descMarkup(p) +
          '<div class="product-foot">' +
            '<span class="product-price price">' + formatPrice(p.price) + ' <small>TJS</small></span>' +
            '<button class="product-link" type="button" data-add-to-cart aria-label="Добавить «' + escapeHtml(p.name) + '» в корзину"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render() {
    const products = getProducts();
    if (!products.length) {
      grid.innerHTML = '<p style="color:var(--text-faint);grid-column:1/-1;text-align:center;padding:40px 0;">Каталог пока пуст — добавьте товары в панели управления.</p>';
      return;
    }
    grid.innerHTML = products.map(cardMarkup).join('');
  }

  render();
})();
