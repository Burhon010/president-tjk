// Рендер сетки товаров на витрине из каталога (localStorage) с фильтром
// по категории. Выполняется синхронно при загрузке страницы, до того как
// main.js настраивает scroll-reveal — поэтому карточки при первой отрисовке
// тоже красиво появляются.
(function () {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const tabsWrap = document.getElementById('storeFilterTabs');
  let activeCategory = '';
  let hasRenderedOnce = false;

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
    const all = getProducts();
    const products = activeCategory ? all.filter((p) => p.category === activeCategory) : all;

    if (!products.length) {
      grid.innerHTML = '<p style="color:var(--text-faint);grid-column:1/-1;text-align:center;padding:40px 0;">' +
        (activeCategory ? 'В категории «' + activeCategory + '» пока нет товаров.' : 'Каталог пока пуст — добавьте товары в панели управления.') +
        '</p>';
    } else {
      grid.innerHTML = products.map(cardMarkup).join('');
    }

    // При первой загрузке карточки красиво проявляются через observer в main.js.
    // При повторном рендере (после смены фильтра) новые карточки этот observer
    // ещё не видел — показываем их сразу, без анимации.
    if (hasRenderedOnce) {
      grid.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in-view'));
    }
    hasRenderedOnce = true;
  }

  function setActiveCategory(cat) {
    activeCategory = cat || '';
    if (tabsWrap) {
      tabsWrap.querySelectorAll('.store-filter-tab').forEach((btn) => {
        btn.classList.toggle('is-active', (btn.dataset.cat || '') === activeCategory);
      });
    }
    render();
  }

  if (tabsWrap) {
    tabsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.store-filter-tab');
      if (!btn) return;
      setActiveCategory(btn.dataset.cat);
    });
  }

  // Ссылки «Смотреть часы →», пункты меню и футера с data-filter
  // переключают фильтр и (за счёт обычного #products в href) сами
  // прокручивают к каталогу — работает одинаково на телефоне,
  // планшете и компьютере, без какого-либо кода под конкретное устройство.
  document.querySelectorAll('[data-filter]').forEach((link) => {
    link.addEventListener('click', () => setActiveCategory(link.dataset.filter));
  });

  render();
})();
