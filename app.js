// app.js - start-up: seeds data, draws the header and starts the router.
(() => {
  'use strict';
  const App = window.App;
  const { el, toast } = App.ui;

  function renderHeader(path = (location.hash.slice(1) || '/').split('?')[0]) {
    const nav = document.getElementById('site-nav');
    const user = App.auth.current();
    const link = (href, text, route, extra) => el('li', {},
      el('a', { href, class: 'nav-link', 'aria-current': path === route ? 'page' : false }, text, extra));
    const items = [link('#/', 'Catalog', '/')];
    if (user) {
      items.push(link('#/cart', 'Cart ', '/cart', el('span', { class: 'cart-badge', id: 'cart-count' }, String(App.cart.count()))));
      items.push(link('#/orders', 'Orders', '/orders'));
      if (user.role === 'admin') items.push(link('#/admin', 'Manage products', '/admin'));
      items.push(el('li', { class: 'user-info' },
        el('span', {}, `Signed in as ${user.name}`),
        el('button', {
          type: 'button', class: 'btn',
          onclick: () => { App.auth.logout(); toast('You have been signed out.'); if (location.hash === '#/' || location.hash === '') App.router.render(); else location.hash = '#/'; },
        }, 'Sign out')));
    } else {
      items.push(link('#/login', 'Sign in', '/login'), link('#/register', 'Register', '/register'));
    }
    nav.replaceChildren(el('ul', { class: 'nav-list' }, items));
  }
  App.renderHeader = renderHeader;

  function skeletons() {
    const card = () => el('li', { class: 'card skeleton', 'aria-hidden': 'true' }, el('div', { class: 'sk-img' }, ''), el('div', { class: 'sk-line' }, ''), el('div', { class: 'sk-line short' }, ''));
    return [el('h1', {}, 'Catalog'), el('p', { class: 'result-count', role: 'status' }, 'Loading products...'),
      el('ul', { class: 'grid', 'aria-busy': 'true' }, Array.from({ length: 8 }, card))];
  }

  // First visit: copy the live catalog into local storage. If the API is down use the built-in catalog.
  async function ensureProducts() {
    if (App.db.products.all().length > 0) return;
    try {
      const live = await App.api.getProducts();
      if (live.length === 0) throw new Error('empty');
      App.db.products.replaceAll(live);
    } catch {
      App.db.products.replaceAll(App.seed);
      toast('The live catalog could not be reached, so the built-in catalog is shown.', 'warn');
    }
  }

  async function start() {
    App.db.onError = () => toast('Your changes could not be saved. Browser storage may be full or blocked.', 'error');
    document.addEventListener('shop:cart', () => {
      const badge = document.getElementById('cart-count');
      if (badge) badge.textContent = String(App.cart.count());
    });
    window.addEventListener('storage', () => renderHeader());
    const main = document.getElementById('main');
    main.replaceChildren(...skeletons());
    renderHeader();
    await App.auth.ensureDemoAdmin();
    await ensureProducts();
    App.router.render();
  }

  start();
})();
