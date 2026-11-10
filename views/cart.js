// cart view: update quantities, remove items and check out.
(() => {
  'use strict';
  const App = window.App;
  const { el, money, productImage, toast } = App.ui;

  App.views.cart = {
    title: 'Your cart',
    render(root) {
      const items = App.cart.items();
      root.append(el('h1', {}, 'Your cart'));
      if (items.length === 0) {
        root.append(el('p', {}, 'Your cart is empty. ', el('a', { href: '#/' }, 'Browse the catalog')));
        return;
      }
      const rerender = () => { root.replaceChildren(); App.views.cart.render(root); root.querySelector('h1')?.focus(); };
      const rows = items.map((item) => el('li', { class: 'cart-item' },
        el('img', { class: 'cart-img', src: productImage(item), alt: '', width: 64, height: 64 }),
        el('div', { class: 'cart-info' },
          el('p', { class: 'cart-title' }, item.title),
          el('p', { class: 'muted' }, `${money.format(item.price)} each`)),
        el('div', { class: 'cart-controls' },
          el('button', { type: 'button', class: 'btn qty', 'aria-label': `Decrease quantity of ${item.title}`, onclick: () => { App.cart.setQty(item.id, item.qty - 1); rerender(); } }, '-'),
          el('span', { class: 'qty-value', 'aria-label': `Quantity ${item.qty}` }, String(item.qty)),
          el('button', { type: 'button', class: 'btn qty', 'aria-label': `Increase quantity of ${item.title}`, onclick: () => { App.cart.setQty(item.id, item.qty + 1); rerender(); } }, '+'),
          el('button', { type: 'button', class: 'btn', 'aria-label': `Remove ${item.title} from cart`, onclick: () => { App.cart.remove(item.id); toast(`${item.title} removed.`); rerender(); } }, 'Remove')),
        el('p', { class: 'line-total' }, money.format((Math.round(item.price * 100) * item.qty) / 100))));

      root.append(
        el('ul', { class: 'cart-list' }, rows),
        el('section', { class: 'summary', 'aria-labelledby': 'summary-title' },
          el('h2', { id: 'summary-title' }, 'Order summary'),
          el('p', { class: 'cart-total' }, 'Total: ', el('strong', {}, money.format(App.cart.totalCents() / 100))),
          el('button', {
            type: 'button', class: 'btn btn-primary',
            onclick: () => {
              const order = App.orders.checkout();
              if (!order) return;
              toast(`Order ${order.id} placed. No payment was taken.`);
              location.hash = '#/orders';
            },
          }, 'Place order')));
    },
  };
})();
