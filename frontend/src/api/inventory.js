const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  // Handle CSV blob responses
  if (res.headers.get('Content-Type')?.includes('text/csv')) {
    return res.blob();
  }
  return res.json();
}

// ─── Products ────────────
export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/products${query ? `?${query}` : ''}`);
};

export const getProduct = (id) => request(`/products/${id}`);

export const createProduct = (data) =>
  request('/products', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id, data) =>
  request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE' });

// ─── Stock ───────────────
export const adjustStock = (id, data) =>
  request(`/products/${id}/stock`, { method: 'POST', body: JSON.stringify(data) });

export const getStockHistory = (id) =>
  request(`/products/${id}/stock-history`);

export const getLowStockProducts = () =>
  request('/products/low-stock');

// ─── Categories ──────────
export const getCategories = () => request('/categories');

export const createCategory = (data) =>
  request('/categories', { method: 'POST', body: JSON.stringify(data) });

export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCategory = (id) =>
  request(`/categories/${id}`, { method: 'DELETE' });

// ─── Analytics ───────────
export const getAnalytics = () => request('/inventory/analytics');

// ─── Export ──────────────
export const exportCSV = async () => {
  const res = await fetch(`${BASE}/products/export/csv`);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_export.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};
