import { useState, useEffect } from 'react';
import * as api from '../../api/inventory';
import ProductForm from './ProductForm';
import StockModal from './StockModal';
import StockHistoryModal from './StockHistoryModal';
import CategoryManager from './CategoryManager';
import InventoryDashboard from './InventoryDashboard';

export default function ProductList({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category_id = categoryFilter;
      if (lowStockOnly) params.low_stock = 'true';
      const data = await api.getProducts(params);
      setProducts(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchLowStockCount = async () => {
    try {
      const data = await api.getLowStockProducts();
      setLowStockCount(data.length);
    } catch {}
  };

  useEffect(() => {
    fetchCategories();
    fetchLowStockCount();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, lowStockOnly]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(id);
      fetchProducts();
      fetchLowStockCount();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFormClose = (saved) => {
    setShowForm(false);
    setEditProduct(null);
    if (saved) {
      fetchProducts();
      fetchLowStockCount();
    }
  };

  const handleStockClose = (saved) => {
    setStockProduct(null);
    if (saved) {
      fetchProducts();
      fetchLowStockCount();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Bar */}
      <div className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400">{user?.email || ''}{user?.method ? ` \u00b7 via ${user.method}` : ''}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage products, stock levels, and categories</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {lowStockCount > 0 && (
                <button
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    lowStockOnly
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${lowStockOnly ? 'bg-white' : 'bg-red-500'}`}></span>
                  </span>
                  {lowStockCount} Low Stock
                </button>
              )}
              <button
                onClick={() => setShowCategories(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Categories
              </button>
              <button
                onClick={api.exportCSV}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                Export CSV
              </button>
              <button
                onClick={() => { setEditProduct(null); setShowForm(true); }}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                + Add Product
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Analysis Charts */}
      <InventoryDashboard position="top" />

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Reorder Lvl</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-400">No products found</td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.current_stock <= p.reorder_level;
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500 md:hidden">{p.category_name || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{p.sku}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                            {p.category_name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">${p.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold ${
                            isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isLow && (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                              </svg>
                            )}
                            {p.current_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500 hidden sm:table-cell">{p.reorder_level}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setStockProduct(p)}
                              title="Adjust Stock"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setHistoryProduct(p)}
                              title="Stock History"
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => { setEditProduct(p); setShowForm(true); }}
                              title="Edit"
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Delete"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Demand Forecasting & Reorder Suggestions */}
      <InventoryDashboard position="bottom" />

      {/* Modals */}
      {showForm && (
        <ProductForm
          product={editProduct}
          categories={categories}
          onClose={handleFormClose}
        />
      )}
      {stockProduct && (
        <StockModal
          product={stockProduct}
          onClose={handleStockClose}
        />
      )}
      {historyProduct && (
        <StockHistoryModal
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}
      {showCategories && (
        <CategoryManager
          onClose={() => { setShowCategories(false); fetchCategories(); }}
        />
      )}
    </div>
  );
}
