const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const analytics = require('../controllers/analyticsController');

// Analytics
router.get('/inventory/analytics', analytics.getAnalytics);

// Products
router.get('/products', ctrl.getProducts);
router.get('/products/low-stock', ctrl.getLowStockProducts);
router.get('/products/export/csv', ctrl.exportCSV);
router.get('/products/:id', ctrl.getProduct);
router.post('/products', ctrl.createProduct);
router.put('/products/:id', ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

// Stock operations
router.post('/products/:id/stock', ctrl.adjustStock);
router.get('/products/:id/stock-history', ctrl.getStockHistory);

// Categories
router.get('/categories', ctrl.getCategories);
router.post('/categories', ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

module.exports = router;
