// services.js - cart and order rules. Views call these instead of touching storage directly.
(() => {
  'use strict';
  const App = (window.App = window.App || { views: {} });
  const changed = () => document.dispatchEvent(new CustomEvent('shop:cart'));
  const STATUS_FLOW = { placed: 'shipped', shipped: 'delivered' };

  const cart = {
    items() {
      const user = App.auth.current();
      return user ? App.db.cart.get(user.id) : [];
    },
    save(items) {
      const user = App.auth.current();
      if (user) App.db.cart.save(user.id, items);
      changed();
    },
    add(product) {
      const items = cart.items();
      const existing = items.find((i) => String(i.id) === String(product.id));
      if (existing) existing.qty += 1;
      else items.push({ id: product.id, title: product.title, price: product.price, image: product.image, qty: 1 });
      cart.save(items);
    },
    setQty(id, qty) {
      const items = cart.items().map((i) => (String(i.id) === String(id) ? { ...i, qty } : i)).filter((i) => i.qty > 0);
      cart.save(items);
    },
    remove: (id) => cart.setQty(id, 0),
    clear: () => cart.save([]),
    count: () => cart.items().reduce((n, i) => n + i.qty, 0),
    totalCents: () => cart.items().reduce((sum, i) => sum + Math.round(i.price * 100) * i.qty, 0),
  };

  const orders = {
    visible() {
      const user = App.auth.current();
      if (!user) return [];
      const all = App.db.orders.all();
      return (user.role === 'admin' ? all : all.filter((o) => o.userId === user.id)).slice().reverse();
    },
    checkout() {
      const user = App.auth.current();
      const items = cart.items();
      if (!user || items.length === 0) return null;
      const order = App.db.orders.add({
        userId: user.id, customer: user.name, items, totalCents: cart.totalCents(),
        status: 'placed', createdAt: new Date().toISOString(),
      });
      cart.clear();
      return order;
    },
    cancel(id) {
      const user = App.auth.current();
      const order = App.db.orders.all().find((o) => o.id === id);
      if (!user || !order || order.userId !== user.id || order.status !== 'placed') return null;
      return App.db.orders.update(id, { status: 'cancelled' });
    },
    advance(id) {
      const order = App.db.orders.all().find((o) => o.id === id);
      if (!App.auth.isAdmin() || !order || !STATUS_FLOW[order.status]) return null;
      return App.db.orders.update(id, { status: STATUS_FLOW[order.status] });
    },
    nextStatus: (status) => STATUS_FLOW[status] || null,
  };

  App.cart = cart;
  App.orders = orders;
})();
