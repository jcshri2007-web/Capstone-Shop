// db.js - persistence layer. The only file that touches localStorage.
(() => {
  'use strict';
  const App = (window.App = window.App || { views: {} });
  const K = {
    users: 'capstone.users.v1', session: 'capstone.session.v1', products: 'capstone.products.v1',
    orders: 'capstone.orders.v1', prefs: 'capstone.prefs.v1', cart: (userId) => `capstone.cart.${userId}.v1`,
  };

  const db = { onError: () => {} };
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { db.onError(); return false; }
  };
  const maxId = (list) => list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);

  db.products = {
    all: () => read(K.products, []),
    replaceAll: (list) => write(K.products, list),
    get: (id) => db.products.all().find((p) => String(p.id) === String(id)),
    create(data) {
      const list = db.products.all();
      const item = { rating: { rate: 0, count: 0 }, ...data, id: maxId(list) + 1 };
      list.push(item);
      write(K.products, list);
      return item;
    },
    update(id, patch) {
      const list = db.products.all();
      const index = list.findIndex((p) => String(p.id) === String(id));
      if (index === -1) return null;
      list[index] = { ...list[index], ...patch, id: list[index].id };
      write(K.products, list);
      return list[index];
    },
    remove(id) {
      write(K.products, db.products.all().filter((p) => String(p.id) !== String(id)));
    },
  };

  db.users = {
    all: () => read(K.users, []),
    byEmail: (email) => db.users.all().find((u) => u.email === String(email).trim().toLowerCase()),
    byId: (id) => db.users.all().find((u) => u.id === id),
    add(user) {
      const list = db.users.all();
      const saved = { ...user, id: `u${maxId(list.map((u) => ({ id: u.id.slice(1) }))) + 1}` };
      list.push(saved);
      write(K.users, list);
      return saved;
    },
  };

  db.session = {
    get: () => read(K.session, null),
    set: (session) => write(K.session, session),
    clear: () => { try { localStorage.removeItem(K.session); } catch { /* ignore */ } },
  };

  db.cart = {
    get: (userId) => read(K.cart(userId), []),
    save: (userId, items) => write(K.cart(userId), items),
  };

  db.orders = {
    all: () => read(K.orders, []),
    add(order) {
      const list = db.orders.all();
      const number = list.reduce((max, o) => Math.max(max, Number(o.id.replace('ORD-', '')) || 0), 1000) + 1;
      const saved = { ...order, id: `ORD-${number}` };
      list.push(saved);
      write(K.orders, list);
      return saved;
    },
    update(id, patch) {
      const list = db.orders.all();
      const index = list.findIndex((o) => o.id === id);
      if (index === -1) return null;
      list[index] = { ...list[index], ...patch };
      write(K.orders, list);
      return list[index];
    },
  };

  db.prefs = {
    get: () => ({ category: 'all', sort: 'featured', ...read(K.prefs, {}) }),
    set: (prefs) => write(K.prefs, prefs),
  };

  App.db = db;
})();
