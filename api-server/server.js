const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// Helper to format SQL query for pgAdmin (copy-paste ready)
function formatQueryForPgAdmin(query, params = []) {
  let formattedQuery = query;
  for (const [index, param] of params.entries()) {
    const placeholder = `$${index + 1}`;
    let value;
    if (param === null) {
      value = 'NULL';
    } else if (typeof param === 'string') {
      value = `'${param.replaceAll("'", "''")}'`;
    } else if (typeof param === 'boolean') {
      value = param ? 'TRUE' : 'FALSE';
    } else if (param instanceof Date) {
      value = `'${param.toISOString()}'`;
    } else {
      value = String(param);
    }
    formattedQuery = formattedQuery.replace(placeholder, value);
  }
  return formattedQuery;
}

// Log query in pgAdmin-ready format
function logPgAdminQuery(label, query, params = []) {
  console.log(`\n📋 [pgAdmin] ${label}:`);
  console.log('─'.repeat(60));
  console.log(formatQueryForPgAdmin(query, params));
  console.log('─'.repeat(60) + '\n');
}

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

// Get enterprise orders with pagination, sorting, and advanced filtering
app.get('/api/enterprise-orders/paginated', async (request, res) => {
  console.log(`📦 [Orders] Request received - query:`, request.query);
  try {
    const skip = Number.parseInt(request.query.skip) || 0;
    const limit = Number.parseInt(request.query.limit) || 50;
    const sortParam = request.query.sort;
    const filterParam = request.query.filter;

    console.log(`   → skip: ${skip}, limit: ${limit}`);

    // Parse sorting parameter
    let orderByClause = 'ORDER BY order_id DESC';
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

    // Parse advanced filters
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    if (filterParam) {
      try {
        const filters = JSON.parse(filterParam);
        console.log(`   → Filters received:`, filters);

        for (const columnName of Object.keys(filters)) {
          const filterConfig = filters[columnName];

          if (!filterConfig || Object.keys(filterConfig).length === 0) {
            continue;
          }

          // Text filters (LIKE, equals, not equals, contains, starts with, ends with)
          if (filterConfig.type === 'text' && filterConfig.value) {
            const value = filterConfig.value;
            switch (filterConfig.operator) {
              case 'contains': {
                whereConditions.push(`${columnName} ILIKE $${paramCounter}`);
                queryParams.push(`%${value}%`);
                paramCounter++;
                break;
              }
              case 'endsWith': {
                whereConditions.push(`${columnName} ILIKE $${paramCounter}`);
                queryParams.push(`%${value}`);
                paramCounter++;
                break;
              }
              case 'equals': {
                whereConditions.push(`${columnName} = $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
              case 'notContains': {
                whereConditions.push(
                  `${columnName} NOT ILIKE $${paramCounter}`,
                );
                queryParams.push(`%${value}%`);
                paramCounter++;
                break;
              }
              case 'notEquals': {
                whereConditions.push(`${columnName} != $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
              case 'startsWith': {
                whereConditions.push(`${columnName} ILIKE $${paramCounter}`);
                queryParams.push(`${value}%`);
                paramCounter++;
                break;
              }
            }
          }

          // Number filters (equals, not equals, greater than, less than, between)
          if (
            filterConfig.type === 'number' &&
            filterConfig.value !== undefined &&
            filterConfig.value !== null &&
            filterConfig.value !== ''
          ) {
            const value = Number(filterConfig.value);
            switch (filterConfig.operator) {
              case 'between': {
                if (
                  filterConfig.value2 !== undefined &&
                  filterConfig.value2 !== null
                ) {
                  whereConditions.push(
                    `${columnName} BETWEEN $${paramCounter} AND $${paramCounter + 1}`,
                  );
                  queryParams.push(value, Number(filterConfig.value2));
                  paramCounter += 2;
                }
                break;
              }
              case 'equals': {
                whereConditions.push(`${columnName} = $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
              case 'greaterThan': {
                whereConditions.push(`${columnName} > $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
              case 'greaterThanOrEqual': {
                whereConditions.push(`${columnName} >= $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
              case 'lessThan': {
                whereConditions.push(`${columnName} < $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
              case 'lessThanOrEqual': {
                whereConditions.push(`${columnName} <= $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
              case 'notEquals': {
                whereConditions.push(`${columnName} != $${paramCounter}`);
                queryParams.push(value);
                paramCounter++;
                break;
              }
            }
          }

          // Date filters (equals, before, after, between)
          if (filterConfig.type === 'date' && filterConfig.value) {
            switch (filterConfig.operator) {
              case 'after': {
                whereConditions.push(`${columnName} > $${paramCounter}::date`);
                queryParams.push(filterConfig.value);
                paramCounter++;
                break;
              }
              case 'before': {
                whereConditions.push(`${columnName} < $${paramCounter}::date`);
                queryParams.push(filterConfig.value);
                paramCounter++;
                break;
              }
              case 'between': {
                if (filterConfig.value2) {
                  whereConditions.push(
                    `${columnName} BETWEEN $${paramCounter}::date AND $${paramCounter + 1}::date`,
                  );
                  queryParams.push(filterConfig.value, filterConfig.value2);
                  paramCounter += 2;
                }
                break;
              }
              case 'equals': {
                whereConditions.push(`${columnName} = $${paramCounter}::date`);
                queryParams.push(filterConfig.value);
                paramCounter++;
                break;
              }
            }
          }

          // Boolean filters
          if (
            filterConfig.type === 'boolean' &&
            filterConfig.value !== undefined &&
            filterConfig.value !== null
          ) {
            whereConditions.push(`${columnName} = $${paramCounter}`);
            queryParams.push(
              filterConfig.value === 'true' || filterConfig.value === true,
            );
            paramCounter++;
          }

          // Select/Multi-select filters (IN or NOT IN clause based on operator)
          if (
            filterConfig.type === 'select' ||
            filterConfig.type === 'multiSelect'
          ) {
            if (
              filterConfig.values &&
              Array.isArray(filterConfig.values) &&
              filterConfig.values.length > 0
            ) {
              const placeholders = filterConfig.values
                .map((_, index) => `$${paramCounter + index}`)
                .join(', ');
              // Use NOT IN for notEquals operator, IN for equals (default)
              const inOperator =
                filterConfig.operator === 'notEquals' ? 'NOT IN' : 'IN';
              whereConditions.push(
                `${columnName} ${inOperator} (${placeholders})`,
              );
              queryParams.push(...filterConfig.values);
              paramCounter += filterConfig.values.length;
            } else if (filterConfig.value) {
              // Single value - use != for notEquals, = for equals
              const eqOperator =
                filterConfig.operator === 'notEquals' ? '!=' : '=';
              whereConditions.push(
                `${columnName} ${eqOperator} $${paramCounter}`,
              );
              queryParams.push(filterConfig.value);
              paramCounter++;
            }
          }
        }

        console.log(`   → WHERE conditions: ${whereConditions.join(' AND ')}`);
        console.log(`   → Query params:`, queryParams);
      } catch (error) {
        console.error('   ⚠️ Error parsing filter parameter:', error);
      }
    }

    const whereClause =
      whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // Build the main query
    const dataQuery = `SELECT * FROM enterprise_orders ${whereClause} ${orderByClause} LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    const countQuery = `SELECT COUNT(*) FROM enterprise_orders ${whereClause}`;

    // Add limit and offset to params
    queryParams.push(limit, skip);

    console.log(`   → Final query: ${dataQuery}`);
    logPgAdminQuery('Data Query', dataQuery, queryParams);

    // Get paginated data with sorting and filtering
    const dataResult = await pool.query(dataQuery, queryParams);
    console.log(`   → Query executed, got ${dataResult.rows.length} rows`);

    // Get total count with same filters (excluding limit and offset)
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    logPgAdminQuery('Count Query', countQuery, countParams);
    const countResult = await pool.query(countQuery, countParams);
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

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching paginated enterprise orders:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch enterprise orders data' });
  }
});

// Get distinct values for a column (for filter options)
app.get('/api/enterprise-orders/distinct/:columnName', async (request, res) => {
  console.log(
    `🎯 [Distinct] Request for column: ${request.params.columnName}, query:`,
    request.query,
  );
  try {
    // ⏱️ Artificial delay for testing loading shimmer (remove in production)
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const { columnName } = request.params;
    const limit = Number.parseInt(request.query.limit) || 100;
    const offset = Number.parseInt(request.query.offset) || 0;

    console.log(`   → offset: ${offset}, limit: ${limit}`);

    // Validate column name to prevent SQL injection
    const allowedColumns = [
      'order_number',
      'order_status',
      'priority',
      'customer_email',
      'customer_type',
      'payment_status',
      'payment_method',
      'product_category',
      'product_subcategory',
      'shipping_city',
      'shipping_state',
      'shipping_country',
      'carrier',
      'warehouse_location',
    ];

    if (!allowedColumns.includes(columnName)) {
      console.log(`   ❌ Invalid column name: ${columnName}`);
      return res.status(400).json({ error: 'Invalid column name' });
    }

    // Query for distinct values, filtering out nulls and empty strings
    const query = `
      SELECT DISTINCT ${columnName} as value 
      FROM enterprise_orders 
      WHERE ${columnName} IS NOT NULL AND ${columnName} != ''
      ORDER BY ${columnName}
      LIMIT $1 OFFSET $2
    `;

    console.log(`   → Final query: ${query.replaceAll(/\s+/g, ' ').trim()}`);
    console.log(`   → Query params: [${limit}, ${offset}]`);

    const result = await pool.query(query, [limit, offset]);
    const values = result.rows.map((row) => row.value);
    const hasMore = values.length === limit;

    console.log(`   → Query executed, got ${values.length} distinct values`);
    console.log(`   ✓ Returning ${values.length} values, hasMore: ${hasMore}`);

    res.json({ hasMore, values });
  } catch (error) {
    console.error('❌ Error fetching distinct values:', error);
    res.status(500).json({ error: 'Failed to fetch distinct values' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
});
