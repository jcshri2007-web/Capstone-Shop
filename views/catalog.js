// catalog view: search, category tabs, sorting and product details.
(() => {
  'use strict';
  const App = window.App;
  const { el, money, label, productImage, toast, modal } = App.ui;

  const SORT_LABELS = {
    featured: 'Featured', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low',
    'rating-desc': 'Top rated', 'name-asc': 'Name: A to Z',
  };
  const SORTERS = {
    featured: null,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'rating-desc': (a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0),
    'name-asc': (a, b) => a.title.localeCompare(b.title),
  };

  function addToCart(product) {
    if (!App.auth.current()) {
      toast('Please sign in to add items to your cart.');
      location.hash = `#/login?next=${encodeURIComponent(location.hash || '#/')}`;
      return;
    }
    App.cart.add(product);
    toast(`${product.title} added to cart.`);
  }

  function showDetails(product) {
    const dialog = modal(product.title, [
      el('img', { class: 'detail-img', src: productImage(product), alt: '', width: 200, height: 200 }),
      el('p', { class: 'card-category' }, label(product.category)),
      el('p', {}, product.description || 'No description yet.'),
      el('p', { class: 'card-rating' }, `Rating ${product.rating?.rate ?? 0} of 5 (${product.rating?.count ?? 0} reviews)`),
      el('p', { class: 'card-price' }, money.format(product.price)),
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'btn', onclick: () => dialog.close() }, 'Close'),
        el('button', { type: 'button', class: 'btn btn-primary', onclick: () => { addToCart(product); dialog.close(); } }, 'Add to cart')),
    ]);
  }

  App.views.catalog = {
    title: 'Catalog',
    render(root) {
      const prefs = App.db.prefs.get();
      const products = App.db.products.all();
      const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
      const state = {
        query: '',
        category: categories.includes(prefs.category) ? prefs.category : 'all',
        sort: SORTERS[prefs.sort] !== undefined ? prefs.sort : 'featured',
      };
      const savePrefs = () => App.db.prefs.set({ category: state.category, sort: state.sort });

      const count = el('p', { class: 'result-count', role: 'status' });
      const grid = el('ul', { class: 'grid' });
      const tabs = el('div', { class: 'tabs', role: 'group', 'aria-label': 'Categories' });
      const search = el('input', { id: 'search', type: 'search', placeholder: 'Type to filter instantly', autocomplete: 'off', maxlength: 60 });
      const sort = el('select', { id: 'sort' }, ...Object.entries(SORT_LABELS).map(([value, text]) => el('option', { value, selected: value === state.sort }, text)));

      function visible() {
        const query = state.query.trim().toLowerCase();
        const list = products.filter((p) =>
          (state.category === 'all' || p.category === state.category) &&
          (!query || p.title.toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query)));
        return SORTERS[state.sort] ? [...list].sort(SORTERS[state.sort]) : list;
      }

      function renderTabs() {
        tabs.replaceChildren(...['all', ...categories].map((name) => el('button', {
          type: 'button', class: 'tab', dataset: { category: name },
          'aria-pressed': String(name === state.category),
          onclick: () => {
            state.category = name; savePrefs(); renderTabs(); renderGrid();
            tabs.querySelector(`[data-category="${CSS.escape(name)}"]`)?.focus();
          },
        }, name === 'all' ? 'All' : label(name))));
      }

      function card(product) {
        return el('li', { class: 'card' },
          el('img', { class: 'card-img', src: productImage(product), alt: '', width: 200, height: 200, loading: 'lazy' }),
          el('p', { class: 'card-category' }, label(product.category)),
          el('h2', { class: 'card-title' }, product.title),
          el('p', { class: 'card-rating' }, `Rating ${product.rating?.rate ?? 0} of 5 (${product.rating?.count ?? 0})`),
          el('p', { class: 'card-price' }, money.format(product.price)),
          el('div', { class: 'card-actions' },
            el('button', { type: 'button', class: 'btn', 'aria-label': `Details for ${product.title}`, onclick: () => showDetails(product) }, 'Details'),
            el('button', { type: 'button', class: 'btn btn-primary', 'aria-label': `Add ${product.title} to cart`, onclick: () => addToCart(product) }, 'Add to cart')));
      }

      function renderGrid() {
        const list = visible();
        grid.replaceChildren(...list.map(card));
        count.textContent = list.length === 0
          ? (products.length === 0 ? 'The catalog is empty.' : 'No products match your filters.')
          : `${list.length} ${list.length === 1 ? 'product' : 'products'} shown`;
      }

      let timer;
      search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.query = search.value; renderGrid(); }, 150); });
      sort.addEventListener('change', () => { state.sort = sort.value; savePrefs(); renderGrid(); });

      root.append(
        el('h1', {}, 'Catalog'),
        el('div', { class: 'controls' },
          el('div', { class: 'control' }, el('label', { for: 'search' }, 'Search products'), search),
          el('div', { class: 'control' }, el('label', { for: 'sort' }, 'Sort by'), sort)),
        tabs, count, grid);
      renderTabs();
      renderGrid();
    },
  };
})();
