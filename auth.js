// auth.js - SIMULATED authentication. Everything runs in the browser, so it is a demo of the
// flow (register, sign in, roles, guarded pages) and is not real security.
(() => {
  'use strict';
  const App = (window.App = window.App || { views: {} });
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const DEMO_ADMIN = { name: 'Demo Admin', email: 'admin@shop.demo', password: 'Admin#2026' };

  const randomHex = (bytes) => {
    const array = new Uint8Array(bytes);
    (window.crypto || { getRandomValues: (a) => a.map(() => Math.floor(Math.random() * 256)) }).getRandomValues(array);
    return [...array].map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  async function hash(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`);
    if (window.crypto && window.crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', data);
      return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381;
    for (const byte of data) h = ((h << 5) + h + byte) | 0;
    return `basic-${h >>> 0}`;
  }

  async function createUser({ name, email, password, role }) {
    const salt = randomHex(8);
    return App.db.users.add({
      name: name.trim(), email: email.trim().toLowerCase(), role, salt,
      passwordHash: await hash(password, salt), createdAt: new Date().toISOString(),
    });
  }

  async function ensureDemoAdmin() {
    if (!App.db.users.byEmail(DEMO_ADMIN.email)) await createUser({ ...DEMO_ADMIN, role: 'admin' });
  }

  const startSession = (user) => App.db.session.set({ userId: user.id, expiresAt: Date.now() + SESSION_MS });

  async function register({ name, email, password }) {
    if (App.db.users.byEmail(email)) return { ok: false, error: 'An account with that email already exists. Try signing in.' };
    const user = await createUser({ name, email, password, role: 'customer' });
    startSession(user);
    return { ok: true, user };
  }

  async function login({ email, password }) {
    const user = App.db.users.byEmail(email);
    const valid = user && (await hash(password, user.salt)) === user.passwordHash;
    if (!valid) return { ok: false, error: 'Incorrect email or password.' };
    startSession(user);
    return { ok: true, user };
  }

  function current() {
    const session = App.db.session.get();
    if (!session || session.expiresAt < Date.now()) return null;
    const user = App.db.users.byId(session.userId);
    return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
  }

  const logout = () => App.db.session.clear();
  const isAdmin = () => current()?.role === 'admin';

  App.auth = { ensureDemoAdmin, register, login, logout, current, isAdmin, DEMO_ADMIN };
})();
