// account views: sign in, register, and the access denied page.
(() => {
  'use strict';
  const App = window.App;
  const { el, field, handleForm, toast } = App.ui;

  const goNext = (query) => {
    const next = query.get('next');
    location.hash = next && next.startsWith('#/') ? next.slice(1) : '/';
  };

  function errorBox() { return el('p', { class: 'form-error', role: 'alert', hidden: true }); }
  function showError(box, message) { box.textContent = message; box.hidden = false; }

  App.views.login = {
    title: 'Sign in',
    render(root, { query }) {
      const box = errorBox();
      const form = el('form', { class: 'form-card' },
        box,
        field({ id: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' }),
        field({ id: 'password', label: 'Password', type: 'password', required: true, autocomplete: 'current-password' }),
        el('button', { type: 'submit', class: 'btn btn-primary' }, 'Sign in'));
      handleForm(form, async (data) => {
        box.hidden = true;
        const result = await App.auth.login({ email: data.get('email'), password: data.get('password') });
        if (!result.ok) { showError(box, result.error); return; }
        toast(`Welcome back, ${result.user.name}.`);
        goNext(query);
      });
      root.append(
        el('h1', {}, 'Sign in'), form,
        el('p', {}, 'New here? ', el('a', { href: `#/register${query.get('next') ? `?next=${encodeURIComponent(query.get('next'))}` : ''}` }, 'Create an account')),
        el('aside', { class: 'demo-note', 'aria-label': 'Demo account' },
          el('p', {}, 'Demo admin account: ', el('strong', {}, App.auth.DEMO_ADMIN.email), ' / ', el('strong', {}, App.auth.DEMO_ADMIN.password))));
    },
  };

  App.views.register = {
    title: 'Create account',
    render(root, { query }) {
      const box = errorBox();
      const form = el('form', { class: 'form-card' },
        box,
        field({ id: 'name', label: 'Full name', required: true, minlength: 2, maxlength: 60, autocomplete: 'name' }),
        field({ id: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' }),
        field({ id: 'password', label: 'Password', type: 'password', required: true, minlength: 8, maxlength: 64, autocomplete: 'new-password', hint: 'At least 8 characters.' }),
        field({ id: 'confirm', label: 'Confirm password', type: 'password', required: true, autocomplete: 'new-password' }),
        el('button', { type: 'submit', class: 'btn btn-primary' }, 'Create account'));
      const password = form.querySelector('#password');
      const confirm = form.querySelector('#confirm');
      const checkMatch = () => confirm.setCustomValidity(confirm.value && confirm.value !== password.value ? 'The passwords do not match.' : '');
      password.addEventListener('input', checkMatch);
      confirm.addEventListener('input', checkMatch);
      handleForm(form, async (data) => {
        box.hidden = true;
        const result = await App.auth.register({ name: data.get('name'), email: data.get('email'), password: data.get('password') });
        if (!result.ok) { showError(box, result.error); return; }
        toast(`Account created. Welcome, ${result.user.name}.`);
        goNext(query);
      });
      root.append(el('h1', {}, 'Create account'), form,
        el('p', {}, 'Already registered? ', el('a', { href: '#/login' }, 'Sign in')));
    },
  };

  App.views.denied = {
    title: 'Access denied',
    render(root) {
      root.append(el('h1', {}, 'Access denied'),
        el('p', {}, 'Only administrators can open this page. ', el('a', { href: '#/' }, 'Back to the catalog')));
    },
  };
})();
