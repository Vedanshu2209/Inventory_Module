const express = require('express');
const cors = require('cors');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', inventoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'Inventory Management' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Inventory API running on http://localhost:${PORT}`);
});
