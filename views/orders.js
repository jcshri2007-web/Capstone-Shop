// orders view: customers see and cancel their orders, admins see all orders and update status.
(() => {
  'use strict';
  const App = window.App;
  const { el, money, label, toast, formatDate } = App.ui;

  App.views.orders = {
    title: 'Orders',
    render(root) {
      const admin = App.auth.isAdmin();
      const orders = App.orders.visible();
      const rerender = () => { root.replaceChildren(); App.views.orders.render(root); };
      root.append(el('h1', {}, admin ? 'All orders' : 'Your orders'));
      if (orders.length === 0) {
        root.append(el('p', {}, 'No orders yet. ', el('a', { href: '#/' }, 'Browse the catalog')));
        return;
      }

      function actions(order) {
        const buttons = [];
        if (!admin && order.status === 'placed') {
          buttons.push(el('button', {
            type: 'button', class: 'btn btn-danger', 'aria-label': `Cancel order ${order.id}`,
            onclick: async () => {
              if (await App.ui.confirm({ title: 'Cancel order', message: `Cancel order ${order.id}?`, confirmLabel: 'Cancel order', danger: true })) {
                App.orders.cancel(order.id); toast(`Order ${order.id} cancelled.`); rerender();
              }
            },
          }, 'Cancel'));
        }
        const next = App.orders.nextStatus(order.status);
        if (admin && next) {
          buttons.push(el('button', {
            type: 'button', class: 'btn', 'aria-label': `Mark order ${order.id} as ${next}`,
            onclick: () => { App.orders.advance(order.id); toast(`Order ${order.id} marked ${next}.`); rerender(); },
          }, `Mark ${next}`));
        }
        return buttons.length ? buttons : '';
      }

      const body = orders.map((order) => el('tr', {},
        el('th', { scope: 'row', 'data-label': 'Order' }, order.id),
        el('td', { 'data-label': 'Date' }, el('time', { datetime: order.createdAt }, formatDate(order.createdAt))),
        admin && el('td', { 'data-label': 'Customer' }, order.customer),
        el('td', { 'data-label': 'Items' }, el('details', {},
          el('summary', {}, `${order.items.reduce((n, i) => n + i.qty, 0)} items`),
          el('ul', { class: 'order-items' }, order.items.map((i) => el('li', {}, `${i.qty} x ${i.title}`))))),
        el('td', { 'data-label': 'Total' }, money.format(order.totalCents / 100)),
        el('td', { 'data-label': 'Status' }, el('span', { class: `badge badge-${order.status}` }, label(order.status))),
        el('td', { 'data-label': 'Actions' }, el('div', { class: 'row-actions' }, actions(order)))));

      root.append(el('div', { class: 'table-wrap' }, el('table', { class: 'table' },
        el('caption', {}, admin ? 'Orders from all customers' : 'Your orders, newest first'),
        el('thead', {}, el('tr', {},
          el('th', { scope: 'col' }, 'Order'), el('th', { scope: 'col' }, 'Date'),
          admin && el('th', { scope: 'col' }, 'Customer'), el('th', { scope: 'col' }, 'Items'),
          el('th', { scope: 'col' }, 'Total'), el('th', { scope: 'col' }, 'Status'), el('th', { scope: 'col' }, 'Actions'))),
        el('tbody', {}, body))));
    },
  };
})();
