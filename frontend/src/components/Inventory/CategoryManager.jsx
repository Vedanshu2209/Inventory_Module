import { useState, useEffect } from 'react';
import * as api from '../../api/inventory';

export default function CategoryManager({ onClose }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.createCategory({ name: newName.trim(), description: newDesc.trim() || null });
      setNewName('');
      setNewDesc('');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    setError('');
    try {
      await api.updateCategory(id, { name: editName.trim(), description: editDesc.trim() || null });
      setEditId(null);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will become uncategorized.`)) return;
    try {
      await api.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Manage Categories</h2>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Add form */}
          <form onSubmit={handleAdd} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>

          {/* Category list */}
          {loading ? (
            <p className="text-center text-gray-400 py-4">Loading...</p>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No categories yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {editId === cat.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          onClick={() => handleUpdate(cat.id)}
                          className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="px-3 py-1.5 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{cat.name}</span>
                          <span className="text-xs text-gray-400">({cat.product_count} products)</span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
