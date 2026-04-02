const { getDb } = require('../models/Product');

// ─── Products ────────────────────────────────────────────

exports.getProducts = (req, res) => {
  const db = getDb();
  const { search, category_id, low_stock } = req.query;

  let sql = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    sql += ` AND p.category_id = ?`;
    params.push(category_id);
  }
  if (low_stock === 'true') {
    sql += ` AND p.current_stock <= p.reorder_level`;
  }

  sql += ` ORDER BY p.updated_at DESC`;

  const products = db.prepare(sql).all(...params);
  res.json(products);
};

exports.getProduct = (req, res) => {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

exports.createProduct = (req, res) => {
  const db = getDb();
  const { name, sku, category_id, price, current_stock, reorder_level } = req.body;

  if (!name || !sku || price == null) {
    return res.status(400).json({ error: 'name, sku, and price are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO products (name, sku, category_id, price, current_stock, reorder_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, sku, category_id || null, price, current_stock || 0, reorder_level || 10);

    if (current_stock > 0) {
      db.prepare(`
        INSERT INTO stock_history (product_id, change_qty, type, reason, stock_after)
        VALUES (?, ?, 'add', 'Initial stock on creation', ?)
      `).run(result.lastInsertRowid, current_stock, current_stock);
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    throw err;
  }
};

exports.updateProduct = (req, res) => {
  const db = getDb();
  const { name, sku, category_id, price, reorder_level } = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  try {
    db.prepare(`
      UPDATE products
      SET name = ?, sku = ?, category_id = ?, price = ?, reorder_level = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name ?? existing.name,
      sku ?? existing.sku,
      category_id !== undefined ? category_id : existing.category_id,
      price ?? existing.price,
      reorder_level ?? existing.reorder_level,
      id
    );

    const updated = db.prepare(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    throw err;
  }
};

exports.deleteProduct = (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
};

// ─── Stock Operations ────────────────────────────────────

exports.adjustStock = (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { quantity, type, reason } = req.body;

  if (!quantity || !type) {
    return res.status(400).json({ error: 'quantity and type are required' });
  }
  if (!['add', 'remove', 'adjustment'].includes(type)) {
    return res.status(400).json({ error: 'type must be add, remove, or adjustment' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let newStock;
  if (type === 'add') {
    newStock = product.current_stock + Math.abs(quantity);
  } else if (type === 'remove') {
    newStock = product.current_stock - Math.abs(quantity);
    if (newStock < 0) return res.status(400).json({ error: 'Insufficient stock' });
  } else {
    newStock = quantity; // direct adjustment sets to exact value
  }

  const changeQty = type === 'adjustment' ? quantity - product.current_stock : (type === 'add' ? Math.abs(quantity) : -Math.abs(quantity));

  const txn = db.transaction(() => {
    db.prepare(`UPDATE products SET current_stock = ?, updated_at = datetime('now') WHERE id = ?`).run(newStock, id);
    db.prepare(`
      INSERT INTO stock_history (product_id, change_qty, type, reason, stock_after)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, changeQty, type, reason || null, newStock);
  });
  txn();

  const updated = db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id);
  res.json(updated);
};

exports.getStockHistory = (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const history = db.prepare(`
    SELECT sh.*, p.name AS product_name, p.sku
    FROM stock_history sh
    JOIN products p ON sh.product_id = p.id
    WHERE sh.product_id = ?
    ORDER BY sh.created_at DESC
  `).all(id);

  res.json(history);
};

exports.getLowStockProducts = (req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.current_stock <= p.reorder_level
    ORDER BY (p.current_stock * 1.0 / p.reorder_level) ASC
  `).all();
  res.json(products);
};

// ─── Categories ──────────────────────────────────────────

exports.getCategories = (req, res) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json(categories);
};

exports.createCategory = (req, res) => {
  const db = getDb();
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description || null);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    throw err;
  }
};

exports.updateCategory = (req, res) => {
  const db = getDb();
  const { name, description } = req.body;
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  try {
    db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?')
      .run(name ?? existing.name, description !== undefined ? description : existing.description, id);
    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    throw err;
  }
};

exports.deleteCategory = (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ message: 'Category deleted' });
};

// ─── Export ──────────────────────────────────────────────

exports.exportCSV = (req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.id, p.name, p.sku, c.name AS category, p.price, p.current_stock, p.reorder_level,
           CASE WHEN p.current_stock <= p.reorder_level THEN 'YES' ELSE 'NO' END AS low_stock,
           p.created_at, p.updated_at
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `).all();

  const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Current Stock', 'Reorder Level', 'Low Stock', 'Created', 'Updated'];
  const rows = products.map(p =>
    [p.id, `"${p.name}"`, p.sku, `"${p.category || ''}"`, p.price, p.current_stock, p.reorder_level, p.low_stock, p.created_at, p.updated_at].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
  res.send(csv);
};
