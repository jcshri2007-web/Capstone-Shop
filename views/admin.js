// admin view: create, read, update and delete products (admin role only).
(() => {
  'use strict';
  const App = window.App;
  const { el, money, label, toast, field, handleForm, modal } = App.ui;

  function openProductForm(product, onSaved) {
    const editing = Boolean(product);
    const categories = [...new Set(App.db.products.all().map((p) => p.category))].sort();
    const form = el('form', {},
      field({ id: 'p-title', label: 'Title', required: true, minlength: 3, maxlength: 120, value: product?.title }),
      field({ id: 'p-price', label: 'Price (USD)', type: 'number', min: '0.01', step: '0.01', required: true, value: product?.price }),
      field({ id: 'p-category', label: 'Category', required: true, maxlength: 40, list: 'category-list', value: product?.category, hint: 'Pick an existing category or type a new one.' }),
      el('datalist', { id: 'category-list' }, categories.map((c) => el('option', { value: c }))),
      field({ id: 'p-image', label: 'Image URL (optional)', type: 'url', pattern: 'https://.*', title: 'The image address must start with https://', value: product?.image, hint: 'Leave empty to use a generated placeholder.' }),
      field({ id: 'p-description', label: 'Description', type: 'textarea', maxlength: 500, value: product?.description }),
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'btn', onclick: () => dialog.close() }, 'Cancel'),
        el('button', { type: 'submit', class: 'btn btn-primary' }, editing ? 'Save changes' : 'Add product')));
    const dialog = modal(editing ? 'Edit product' : 'Add product', form);
    handleForm(form, (data) => {
      const values = {
        title: data.get('p-title').trim(), price: Math.round(Number(data.get('p-price')) * 100) / 100,
        category: data.get('p-category').trim().toLowerCase(), image: data.get('p-image').trim(),
        description: data.get('p-description').trim(),
      };
      if (editing) App.db.products.update(product.id, values); else App.db.products.create(values);
      toast(editing ? `${values.title} updated.` : `${values.title} added.`);
      dialog.close();
      onSaved();
    });
  }

  App.views.admin = {
    title: 'Manage products',
    render(root) {
      const rerender = () => { root.replaceChildren(); App.views.admin.render(root); };
      const products = App.db.products.all();
      root.append(
        el('h1', {}, 'Manage products'),
        el('div', { class: 'toolbar' },
          el('button', { type: 'button', class: 'btn btn-primary', onclick: () => openProductForm(null, rerender) }, 'Add product'),
          el('button', {
            type: 'button', class: 'btn',
            onclick: async () => {
              if (await App.ui.confirm({ title: 'Reset catalog', message: 'Replace all products with the built-in catalog? Your changes will be lost.', confirmLabel: 'Reset', danger: true })) {
                App.db.products.replaceAll(App.seed); toast('Catalog reset to the built-in products.'); rerender();
              }
            },
          }, 'Reset catalog')),
        el('p', { class: 'result-count', role: 'status' }, `${products.length} products`));

      const rows = products.map((p) => el('tr', {},
        el('th', { scope: 'row', 'data-label': 'Product' }, p.title),
        el('td', { 'data-label': 'Category' }, label(p.category)),
        el('td', { 'data-label': 'Price' }, money.format(p.price)),
        el('td', { 'data-label': 'Actions' }, el('div', { class: 'row-actions' },
          el('button', { type: 'button', class: 'btn', 'aria-label': `Edit ${p.title}`, onclick: () => openProductForm(p, rerender) }, 'Edit'),
          el('button', {
            type: 'button', class: 'btn btn-danger', 'aria-label': `Delete ${p.title}`,
            onclick: async () => {
              if (await App.ui.confirm({ title: 'Delete product', message: `Delete "${p.title}"? This cannot be undone.`, confirmLabel: 'Delete', danger: true })) {
                App.db.products.remove(p.id); toast(`${p.title} deleted.`); rerender();
              }
            },
          }, 'Delete')))));

      root.append(el('div', { class: 'table-wrap' }, el('table', { class: 'table' },
        el('caption', {}, 'Product catalog'),
        el('thead', {}, el('tr', {}, ['Product', 'Category', 'Price', 'Actions'].map((h) => el('th', { scope: 'col' }, h)))),
        el('tbody', {}, rows))));
    },
  };
})();
