const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3001;

// Enable CORS for React app
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'root',
  host: 'localhost',
  database: 'car_sales_db',
  password: 'ty3-6url-c088l3r-kr44l',
  port: 5432,
});

// Get all car sales
app.get('/api/car-sales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM car_sales ORDER BY car_id');
    res.json({
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching car sales:', error);
    res.status(500).json({ error: 'Failed to fetch car sales data' });
  }
});

app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
});
