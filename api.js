// api.js - the only file that talks to the network (FakeStoreAPI).
(() => {
  'use strict';
  const App = (window.App = window.App || { views: {} });
  const BASE_URL = 'https://fakestoreapi.com';
  const TIMEOUT_MS = 8000;

  async function request(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${BASE_URL}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function getProducts() {
    const data = await request('/products');
    if (!Array.isArray(data)) throw new Error('Unexpected response');
    return data
      .filter((p) => p && p.id != null && typeof p.title === 'string' && Number.isFinite(Number(p.price)))
      .map((p) => ({
        id: Number(p.id), title: p.title, price: Number(p.price), description: String(p.description || ''),
        category: String(p.category || 'other'), image: typeof p.image === 'string' ? p.image : '',
        rating: { rate: Number(p.rating?.rate) || 0, count: Number(p.rating?.count) || 0 },
      }));
  }

  App.api = { getProducts };
})();
