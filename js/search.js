// Поиск по каталогу — ищет среди названия, категории и описания товаров.
(function () {
  const searchBtn = document.getElementById('searchBtn');
  const overlay = document.getElementById('searchOverlay');
  const closeBtn = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');
  const resultsEl = document.getElementById('searchResults');
  if (!searchBtn || !overlay) return;

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

  function openSearch() {
    window.closeMobileNav?.();
    overlay.classList.add('is-open');
    window.syncScrollLock?.();
    // Фокусируем сразу, без задержки — на iOS клавиатура надёжно появляется,
    // только если focus() вызван синхронно в ответ на нажатие.
    input.focus();
  }
  function closeSearch() {
    overlay.classList.remove('is-open');
    window.syncScrollLock?.();
  }

  searchBtn.addEventListener('click', openSearch);
  closeBtn.addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeSearch();
    if ((e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) &&
        !overlay.classList.contains('is-open') &&
        document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearch();
    }
  });

  function runSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      resultsEl.innerHTML = '<p class="search-hint">Начните вводить название или категорию товара.</p>';
      return;
    }
    const matches = getProducts().filter((p) => (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    ));
    if (!matches.length) {
      resultsEl.innerHTML = '<p class="search-empty">Ничего не найдено по запросу «' + escapeHtml(query.trim()) + '».</p>';
      return;
    }
    resultsEl.innerHTML = matches.map((p) => (
      '<button class="search-row" type="button" data-id="' + p.id + '">' +
        '<div class="thumb">' + mediaMarkup(p) + '</div>' +
        '<div class="info">' +
          '<div class="name">' + escapeHtml(p.name) + '</div>' +
          '<div class="cat">' + p.category + '</div>' +
        '</div>' +
        '<span class="price">' + formatPrice(p.price) + ' TJS</span>' +
      '</button>'
    )).join('');
  }

  input.addEventListener('input', () => runSearch(input.value));

  resultsEl.addEventListener('click', (e) => {
    const row = e.target.closest('.search-row');
    if (!row) return;
    const id = row.dataset.id;
    closeSearch();
    input.value = '';
    runSearch('');

    const card = document.getElementById('product-' + id);
    if (!card) return;
    setTimeout(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('is-highlighted');
      setTimeout(() => card.classList.remove('is-highlighted'), 1800);
    }, 250);
  });
})();
