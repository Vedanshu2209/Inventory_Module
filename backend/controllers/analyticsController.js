const { getDb } = require('../models/Product');

/**
 * Category statistics: product counts, total stock value per category
 */
function calculateCategoryStats(db) {
  const stats = db.prepare(`
    SELECT
      c.id,
      c.name,
      COUNT(p.id) AS product_count,
      COALESCE(SUM(p.current_stock), 0) AS total_stock,
      COALESCE(SUM(p.current_stock * p.price), 0) AS stock_value
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();

  // Include uncategorized products
  const uncategorized = db.prepare(`
    SELECT
      COUNT(*) AS product_count,
      COALESCE(SUM(current_stock), 0) AS total_stock,
      COALESCE(SUM(current_stock * price), 0) AS stock_value
    FROM products
    WHERE category_id IS NULL
  `).get();

  if (uncategorized.product_count > 0) {
    stats.push({
      id: null,
      name: 'Uncategorized',
      product_count: uncategorized.product_count,
      total_stock: uncategorized.total_stock,
      stock_value: uncategorized.stock_value,
    });
  }

  return stats;
}

/**
 * Simple demand forecasting using weighted moving average on stock_history.
 *
 * Logic:
 * - Look at the last 90 days of "remove" operations per product (these represent consumption/demand).
 * - Calculate a weighted daily average (recent days weighted higher).
 * - Extrapolate to 30 days ahead.
 * - Compare with current stock to produce a reorder suggestion.
 *
 * Since the seed data only has "add" events we also synthesize plausible
 * demand from the product's price tier and reorder level when no remove
 * history exists yet, so the chart is useful immediately.
 */
function forecastDemand(db) {
  const products = db.prepare(`
    SELECT p.id, p.name, p.sku, p.current_stock, p.reorder_level, p.price,
           c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `).all();

  const forecasts = products.map((product) => {
    // Get removal history for last 90 days
    const history = db.prepare(`
      SELECT change_qty, created_at
      FROM stock_history
      WHERE product_id = ? AND type = 'remove'
        AND created_at >= datetime('now', '-90 days')
      ORDER BY created_at ASC
    `).all(product.id);

    let dailyDemand;

    if (history.length >= 3) {
      // Weighted moving average: more recent removals get higher weight
      const now = Date.now();
      let weightedSum = 0;
      let weightTotal = 0;

      for (const h of history) {
        const daysAgo = Math.max(1, (now - new Date(h.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const weight = 1 / daysAgo; // inverse-time weighting
        const qty = Math.abs(h.change_qty);
        weightedSum += qty * weight;
        weightTotal += weight;
      }

      const avgPerEvent = weightedSum / weightTotal;
      const spanDays = Math.max(1,
        (new Date(history[history.length - 1].created_at) - new Date(history[0].created_at)) / (1000 * 60 * 60 * 24)
      );
      const eventsPerDay = history.length / spanDays;
      dailyDemand = avgPerEvent * eventsPerDay;
    } else {
      // Synthetic estimate based on reorder level and price tier
      // Higher reorder levels suggest faster-moving items
      // Cheaper items tend to sell faster
      const priceFactor = product.price < 20 ? 1.5 : product.price < 100 ? 1.0 : 0.5;
      dailyDemand = (product.reorder_level / 15) * priceFactor;
    }

    const forecast30d = Math.round(dailyDemand * 30);
    const daysUntilStockout = dailyDemand > 0
      ? Math.round(product.current_stock / dailyDemand)
      : 999;
    const suggestedReorder = Math.max(0, forecast30d - product.current_stock + product.reorder_level);

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category_name || 'Uncategorized',
      current_stock: product.current_stock,
      reorder_level: product.reorder_level,
      daily_demand: Math.round(dailyDemand * 100) / 100,
      forecast_30d: forecast30d,
      days_until_stockout: daysUntilStockout,
      suggested_reorder: suggestedReorder,
      risk: daysUntilStockout <= 7 ? 'critical' : daysUntilStockout <= 14 ? 'warning' : 'ok',
    };
  });

  return forecasts;
}

exports.getAnalytics = (req, res) => {
  const db = getDb();
  const categoryStats = calculateCategoryStats(db);
  const forecastData = forecastDemand(db);
  res.json({ categoryStats, forecastData });
};
