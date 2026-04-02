import { useState } from 'react';
import * as api from '../../api/inventory';

export default function StockModal({ product, onClose }) {
  const [type, setType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError('Enter a valid quantity greater than 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.adjustStock(product.id, { quantity: qty, type, reason: reason || undefined });
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewStock = () => {
    const qty = parseInt(quantity, 10) || 0;
    if (type === 'add') return product.current_stock + qty;
    if (type === 'remove') return Math.max(0, product.current_stock - qty);
    return qty;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => onClose(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Adjust Stock</h2>
          <p className="text-sm text-gray-500 mt-0.5">{product.name} ({product.sku})</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Current stock display */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
            <span className="text-sm text-gray-600">Current Stock</span>
            <span className="text-xl font-bold text-gray-900">{product.current_stock}</span>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'add', label: 'Add', color: 'green' },
                { value: 'remove', label: 'Remove', color: 'red' },
                { value: 'adjustment', label: 'Set To', color: 'blue' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 font-medium transition-colors cursor-pointer ${
                    type === opt.value
                      ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={
                    type === opt.value
                      ? {
                          borderColor:
                            opt.color === 'green' ? '#22c55e' : opt.color === 'red' ? '#ef4444' : '#3b82f6',
                          backgroundColor:
                            opt.color === 'green' ? '#f0fdf4' : opt.color === 'red' ? '#fef2f2' : '#eff6ff',
                          color:
                            opt.color === 'green' ? '#15803d' : opt.color === 'red' ? '#b91c1c' : '#1d4ed8',
                        }
                      : {}
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'adjustment' ? 'New Stock Level' : 'Quantity'}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Received shipment, Damaged goods"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg">
              <span className="text-sm text-blue-700">Stock After</span>
              <span className="text-xl font-bold text-blue-900">{previewStock()}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
