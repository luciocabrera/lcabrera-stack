const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// Enable CORS for React app
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  database: 'car_sales_db',
  host: 'localhost',
  password: 'ty3-6url-c088l3r-kr44l',
  port: 5432,
  user: 'root',
});

// Get all car sales
app.get('/api/car-sales', async (request, res) => {
  try {
    console.log('📊 [All] Fetching all car sales');
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

// Get car sales with pagination (offset-limit strategy)
app.get('/api/car-sales/paginated', async (request, res) => {
  console.log(`📊 [Paginated] Request received - query:`, request.query);
  try {
    const skip = Number.parseInt(request.query.skip) || 0;
    const limit = Number.parseInt(request.query.limit) || 50;
    const sortParam = request.query.sort;

    console.log(`   → skip: ${skip}, limit: ${limit}`);

    // Parse sorting parameter
    let orderByClause = 'ORDER BY car_id';
    if (sortParam) {
      try {
        const sorting = JSON.parse(sortParam);
        if (Array.isArray(sorting) && sorting.length > 0) {
          const orderByParts = sorting.map((sort) => {
            const direction = sort.direction === 'desc' ? 'DESC' : 'ASC';
            return `${sort.columnKey} ${direction}`;
          });
          orderByClause = `ORDER BY ${orderByParts.join(', ')}`;
          console.log(`   → Sorting: ${orderByClause}`);
        }
      } catch (error) {
        console.error('   ⚠️ Error parsing sort parameter:', error);
      }
    }

    // Get paginated data with sorting
    const dataResult = await pool.query(
      `SELECT * FROM car_sales ${orderByClause} LIMIT $1 OFFSET $2`,
      [limit, skip],
    );
    console.log(`   → Query executed, got ${dataResult.rows.length} rows`);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM car_sales');
    const total = Number.parseInt(countResult.rows[0].count);
    console.log(`   → Total count: ${total}`);

    // Calculate if there are more rows
    const hasMore = skip + dataResult.rows.length < total;

    const responseData = {
      data: dataResult.rows,
      hasMore,
      total,
    };

    console.log(
      `   ✓ Returning ${dataResult.rows.length} rows, hasMore: ${hasMore}, total: ${total}`,
    );
    console.log(`   ✓ Response keys:`, Object.keys(responseData));
    console.log(
      `   ✓ First row keys:`,
      dataResult.rows.length > 0 ? Object.keys(dataResult.rows[0]) : 'no rows',
    );

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching paginated car sales:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch car sales data' });
  }
});

app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
});
