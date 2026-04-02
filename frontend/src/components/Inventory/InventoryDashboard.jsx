import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import * as api from '../../api/inventory';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function CategoryPieChart({ data }) {
  if (!data.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Products by Category</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="product_count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={2}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={true}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} products`, 'Count']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function StockValueBarChart({ data }) {
  if (!data.length) return null;
  const chartData = data
    .map((d) => ({ name: d.name, value: Math.round(d.stock_value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock Value by Category ($)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, 'Stock Value']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DemandForecastChart({ data }) {
  if (!data.length) return null;
  // Group forecast totals by category for the pie chart
  const byCategory = {};
  for (const item of data) {
    const cat = item.category || 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + item.forecast_30d;
  }
  const pieData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">30-Day Demand Forecast by Category</h3>
      <p className="text-xs text-gray-400 mb-3">Predicted total units needed per category over next 30 days</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={2}
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={true}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} units`, 'Forecast']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReorderSuggestions({ data }) {
  const needsReorder = data
    .filter((d) => d.risk !== 'ok')
    .sort((a, b) => a.days_until_stockout - b.days_until_stockout);

  if (!needsReorder.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Reorder Suggestions</h3>
        <p className="text-sm text-gray-400 text-center py-6">All stock levels healthy — no reorders needed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Reorder Suggestions</h3>
        <p className="text-xs text-gray-400 mt-0.5">Products predicted to run low within 14 days</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Stock</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Daily Demand</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Days Left</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">30d Forecast</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Suggested Order</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {needsReorder.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                </td>
                <td className="px-4 py-2.5 text-sm text-right text-gray-700">{item.current_stock}</td>
                <td className="px-4 py-2.5 text-sm text-right text-gray-700">{item.daily_demand}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-gray-900">{item.days_until_stockout}</td>
                <td className="px-4 py-2.5 text-sm text-right text-gray-700">{item.forecast_30d}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-blue-700">{item.suggested_reorder}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.risk === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.risk === 'critical' ? 'Critical' : 'Warning'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InventoryDashboard({ position }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-400">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Top section: category charts
  if (position === 'top') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryPieChart data={data.categoryStats} />
          <StockValueBarChart data={data.categoryStats} />
        </div>
      </div>
    );
  }

  // Bottom section: demand forecast + reorder suggestions
  if (position === 'bottom') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DemandForecastChart data={data.forecastData} />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Forecast Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {data.forecastData.reduce((s, d) => s + d.forecast_30d, 0)}
                </div>
                <div className="text-xs text-blue-600 mt-1">Total 30d Demand</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {data.forecastData.filter((d) => d.risk === 'critical').length}
                </div>
                <div className="text-xs text-red-600 mt-1">Critical Items</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {data.forecastData.filter((d) => d.risk === 'warning').length}
                </div>
                <div className="text-xs text-amber-600 mt-1">Warning Items</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {data.forecastData.filter((d) => d.risk === 'ok').length}
                </div>
                <div className="text-xs text-green-600 mt-1">Healthy Items</div>
              </div>
            </div>
          </div>
        </div>
        <ReorderSuggestions data={data.forecastData} />
      </div>
    );
  }

  return null;
}
