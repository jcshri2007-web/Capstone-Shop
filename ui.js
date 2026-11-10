// ui.js - small DOM helpers shared by every view. Nothing here talks to storage or the network.
(() => {
  'use strict';
  const App = (window.App = window.App || { views: {} });
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  function append(node, children) {
    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
  }

  // el('button', { class: 'btn', onclick: fn }, 'Label'): text is always inserted as text, never as HTML.
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === false || value == null) continue;
      if (key === 'class') node.className = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, String(value));
    }
    append(node, children);
    return node;
  }

  const label = (text) => String(text || '').charAt(0).toUpperCase() + String(text || '').slice(1);

  function productImage(product) {
    const url = product.image;
    if (typeof url === 'string' && url.startsWith('https://')) return url;
    const letters = String(product.title || '?').trim().slice(0, 2).toUpperCase();
    let hue = 0;
    for (const ch of String(product.title)) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="hsl(${hue},55%,82%)"/><text x="100" y="118" font-family="sans-serif" font-size="64" text-anchor="middle" fill="hsl(${hue},45%,25%)">${letters.replace(/[<>&]/g, '')}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function toast(message, kind = 'info') {
    const live = document.getElementById('announce');
    if (live) { live.textContent = ''; setTimeout(() => { live.textContent = message; }, 50); }
    const box = document.getElementById('toasts');
    if (!box) return;
    const note = el('p', { class: `toast toast-${kind}` }, message);
    box.append(note);
    setTimeout(() => note.remove(), 4500);
  }

  // Native <dialog> modal. Focus returns to the element that opened it.
  function modal(title, content, { onClose } = {}) {
    const opener = document.activeElement;
    const id = `dlg-${Math.random().toString(36).slice(2, 8)}`;
    const dialog = el('dialog', { 'aria-labelledby': `${id}-title` }, el('h2', { id: `${id}-title` }, title), content);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (opener && opener.isConnected) opener.focus();
      if (onClose) onClose();
    });
    document.body.append(dialog);
    dialog.showModal();
    return dialog;
  }

  function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      let accepted = false;
      const dialog = modal(title, [
        el('p', {}, message),
        el('div', { class: 'actions' },
          el('button', { type: 'button', class: 'btn', onclick: () => dialog.close() }, 'Cancel'),
          el('button', { type: 'button', class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, onclick: () => { accepted = true; dialog.close(); } }, confirmLabel)),
      ], { onClose: () => resolve(accepted) });
    });
  }

  // Labelled form field with hint and error slots wired up through aria-describedby.
  function field(o) {
    const hintId = `${o.id}-hint`;
    const errorId = `${o.id}-error`;
    const common = {
      id: o.id, name: o.name || o.id, required: o.required, autocomplete: o.autocomplete,
      minlength: o.minlength, maxlength: o.maxlength, pattern: o.pattern, title: o.title,
      'aria-describedby': [o.hint ? hintId : null, errorId].filter(Boolean).join(' '),
    };
    let control;
    if (o.type === 'textarea') control = el('textarea', { ...common, rows: o.rows || 4 }, o.value || '');
    else if (o.type === 'select') control = el('select', common, ...o.options.map(([value, text]) => el('option', { value, selected: value === o.value }, text)));
    else control = el('input', { ...common, type: o.type || 'text', value: o.value ?? '', min: o.min, max: o.max, step: o.step, list: o.list });
    return el('div', { class: 'field' },
      el('label', { for: o.id }, o.label),
      o.hint && el('span', { id: hintId, class: 'hint' }, o.hint),
      control,
      el('span', { id: errorId, class: 'error', hidden: true }));
  }

  function validateForm(form) {
    let first = null;
    for (const control of form.querySelectorAll('input, select, textarea')) {
      const error = document.getElementById(`${control.id}-error`);
      if (!error) continue;
      if (control.checkValidity()) {
        error.hidden = true; error.textContent = ''; control.removeAttribute('aria-invalid');
      } else {
        error.textContent = control.validationMessage; error.hidden = false;
        control.setAttribute('aria-invalid', 'true');
        first = first || control;
      }
    }
    if (first) first.focus();
    return !first;
  }

  // Custom inline validation (browser bubbles are switched off with novalidate).
  function handleForm(form, onValid) {
    form.noValidate = true;
    form.addEventListener('input', (event) => {
      const control = event.target;
      if (control.getAttribute && control.getAttribute('aria-invalid') && control.checkValidity()) {
        const error = document.getElementById(`${control.id}-error`);
        if (error) { error.hidden = true; error.textContent = ''; }
        control.removeAttribute('aria-invalid');
      }
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (validateForm(form)) await onValid(new FormData(form));
    });
  }

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' });

  App.ui = { el, money, label, productImage, toast, modal, confirm: confirmDialog, field, handleForm, formatDate };
})();
