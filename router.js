// router.js - hash routing with sign-in and role guards. Hash routes work on any static host.
(() => {
  'use strict';
  const App = window.App;
  const ROUTES = {
    '/': { view: 'catalog' },
    '/cart': { view: 'cart', auth: 'user' },
    '/orders': { view: 'orders', auth: 'user' },
    '/admin': { view: 'admin', auth: 'admin' },
    '/login': { view: 'login', guestOnly: true },
    '/register': { view: 'register', guestOnly: true },
  };

  const parse = () => {
    const [path, queryString = ''] = (location.hash.slice(1) || '/').split('?');
    return { path, query: new URLSearchParams(queryString) };
  };

  function render() {
    const { path, query } = parse();
    const route = ROUTES[path];
    if (!route) { location.replace('#/'); return; }
    const user = App.auth.current();
    if (route.auth && !user) {
      App.ui.toast('Please sign in to continue.');
      location.replace(`#/login?next=${encodeURIComponent(`#${path}`)}`);
      return;
    }
    if (route.guestOnly && user) { location.replace('#/'); return; }

    const view = route.auth === 'admin' && user.role !== 'admin' ? App.views.denied : App.views[route.view];
    const root = document.getElementById('main');
    root.replaceChildren();
    view.render(root, { query });
    document.title = `${view.title} - Capstone Shop`;
    const heading = root.querySelector('h1');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
    App.renderHeader(path);
  }

  App.router = { render };
  window.addEventListener('hashchange', render);
})();
