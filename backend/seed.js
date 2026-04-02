const { getDb } = require('./models/Product');

function seed() {
  const db = getDb();

  // Clear existing data
  db.exec(`
    DELETE FROM stock_history;
    DELETE FROM products;
    DELETE FROM categories;
  `);

  // Seed categories
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, description) VALUES (?, ?)'
  );
  const categories = [
    ['Electronics', 'Electronic devices and components'],
    ['Office Supplies', 'Stationery and office equipment'],
    ['Furniture', 'Office and home furniture'],
    ['Clothing', 'Apparel and accessories'],
    ['Food & Beverages', 'Consumable food items and drinks'],
  ];

  const categoryIds = {};
  for (const [name, desc] of categories) {
    const result = insertCategory.run(name, desc);
    categoryIds[name] = result.lastInsertRowid;
  }

  // Seed products
  const insertProduct = db.prepare(`
    INSERT INTO products (name, sku, category_id, price, current_stock, reorder_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Wireless Mouse', 'ELEC-001', categoryIds['Electronics'], 29.99, 150, 20],
    ['Mechanical Keyboard', 'ELEC-002', categoryIds['Electronics'], 89.99, 75, 15],
    ['USB-C Hub', 'ELEC-003', categoryIds['Electronics'], 45.50, 8, 10],
    ['27" Monitor', 'ELEC-004', categoryIds['Electronics'], 349.99, 30, 5],
    ['Webcam HD', 'ELEC-005', categoryIds['Electronics'], 59.99, 3, 10],
    ['A4 Copy Paper (Ream)', 'OFFC-001', categoryIds['Office Supplies'], 8.99, 500, 50],
    ['Ballpoint Pens (12pk)', 'OFFC-002', categoryIds['Office Supplies'], 5.49, 200, 30],
    ['Sticky Notes Pack', 'OFFC-003', categoryIds['Office Supplies'], 3.99, 5, 25],
    ['Stapler Heavy Duty', 'OFFC-004', categoryIds['Office Supplies'], 12.99, 45, 10],
    ['Whiteboard Markers (8pk)', 'OFFC-005', categoryIds['Office Supplies'], 9.99, 60, 15],
    ['Standing Desk', 'FURN-001', categoryIds['Furniture'], 599.99, 12, 3],
    ['Ergonomic Chair', 'FURN-002', categoryIds['Furniture'], 449.99, 18, 5],
    ['Bookshelf 5-Tier', 'FURN-003', categoryIds['Furniture'], 129.99, 2, 5],
    ['Filing Cabinet', 'FURN-004', categoryIds['Furniture'], 189.99, 9, 4],
    ['Polo Shirt (Company)', 'CLTH-001', categoryIds['Clothing'], 24.99, 100, 20],
    ['Safety Vest', 'CLTH-002', categoryIds['Clothing'], 14.99, 7, 15],
    ['Work Boots', 'CLTH-003', categoryIds['Clothing'], 79.99, 25, 8],
    ['Coffee Beans 1kg', 'FOOD-001', categoryIds['Food & Beverages'], 18.99, 40, 10],
    ['Bottled Water (24pk)', 'FOOD-002', categoryIds['Food & Beverages'], 6.99, 4, 20],
    ['Snack Box Assorted', 'FOOD-003', categoryIds['Food & Beverages'], 22.99, 15, 8],
  ];

  const insertHistory = db.prepare(`
    INSERT INTO stock_history (product_id, change_qty, type, reason, stock_after)
    VALUES (?, ?, 'add', 'Initial stock', ?)
  `);

  const seedAll = db.transaction(() => {
    for (const p of products) {
      const result = insertProduct.run(...p);
      insertHistory.run(result.lastInsertRowid, p[4], p[4]);
    }
  });

  seedAll();
  console.log('Database seeded successfully with sample data.');
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${products.length} products`);
}

seed();
