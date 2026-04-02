import { useState, useEffect } from 'react';
import * as api from '../../api/inventory';

export default function StockHistoryModal({ product, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStockHistory(product.id)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [product.id]);

  const typeStyles = {
    add: 'bg-green-100 text-green-800',
    remove: 'bg-red-100 text-red-800',
    adjustment: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Stock History</h2>
          <p className="text-sm text-gray-500 mt-0.5">{product.name} ({product.sku})</p>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No stock history</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase shrink-0 mt-0.5 ${typeStyles[h.type]}`}>
                    {h.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        {h.change_qty > 0 ? `+${h.change_qty}` : h.change_qty}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        Stock: {h.stock_after}
                      </span>
                    </div>
                    {h.reason && <p className="text-sm text-gray-600 mt-0.5">{h.reason}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
