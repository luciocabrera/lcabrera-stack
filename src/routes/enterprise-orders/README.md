# Enterprise Orders Route

This route displays enterprise orders data with infinite scrolling capabilities.

## Route Information

- **Path**: `/enterprise-orders`
- **Component**: `EnterpriseOrders`
- **API Endpoint**: `/api/enterprise-orders/paginated`

## Features

✅ **Infinite Scrolling** - Loads 50 records initially, then 50 more as you scroll
✅ **Sorting** - Click column headers to sort (persisted in URL)
✅ **Column Management** - Show/hide columns, reorder, resize (persisted in cookies)
✅ **100,000 Records** - Displays large dataset with ~50 columns
✅ **Diverse Data Types** - Currency, integers, decimals, text, booleans, dates

## Setup

### 1. Create Database Table

```bash
cd /home/lucio/workspace/db
./setup_orders.sh
```

This will:

- Create the `enterprise_orders` table with 52 columns
- Generate 100,000 realistic records
- Create indexes for performance

### 2. Start API Server

```bash
cd /home/lucio/workspace/frameworks/vite-react-compiler/api-server
node server.js
```

The API will be available at `http://localhost:3001`

### 3. Start React App

```bash
cd /home/lucio/workspace/frameworks/vite-react-compiler
npm run dev
```

### 4. Navigate to Route

Open your browser to:

```
http://localhost:5173/enterprise-orders
```

## File Structure

```
src/routes/enterprise-orders/
├── EnterpriseOrders.component.tsx     # Main component with table
├── EnterpriseOrders.constants.tsx     # Column definitions (31 columns)
├── EnterpriseOrders.stylex.ts         # Styles
├── EnterpriseOrders.types.ts          # TypeScript types
├── enterprise-orders.loader.ts        # Data loader with Suspense
├── enterprise-orders.meta.ts          # Page metadata
├── enterprise-orders.errorBoundary.tsx # Error handling
├── enterprise-orders.errorBoundary.stylex.ts
└── root.ts                            # Route exports
```

## API Service

```typescript
// src/services/enterpriseOrders.api.ts
enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
  skip: 0,
  limit: 50,
  sorting: [{ columnKey: 'order_date', direction: 'desc' }],
  filter: {
    /* optional filters */
  },
});
```

## Columns (31 displayed by default)

### Order Information

- Order ID, Order Number, Order Date, Status, Priority

### Customer Information

- Customer Name, Email, Type, VIP Status, Loyalty Points

### Financial Data

- Total Amount, Subtotal, Tax, Shipping Cost, Discount

### Payment Information

- Payment Status, Payment Method

### Product Information

- Category, Subcategory, Quantity, Unit Price

### Shipping Information

- Ship City, Ship State, Ship Country, Carrier, Warehouse

### Additional Flags

- Rush Order, Gift, Customer Rating

### Dates

- Delivery Date, Shipped Date

## State Persistence

### URL Parameters (Priority)

- Sorting: `?sort=[{"columnKey":"order_date","direction":"desc"}]`
- Column visibility, order (encoded in URL)

### Cookies (Fallback)

- Column order
- Column visibility
- Column sizing
- Sorting

### Persistence Key

`enterprise-orders-table`

## Infinite Scroll Configuration

```typescript
{
  initialPageSize: 50,      // Initial records loaded
  loadMorePageSize: 50,     // Records per scroll
  threshold: 200,           // Pixels from bottom to trigger load
  strategy: 'offset-limit', // Pagination strategy
  isEnabled: true           // Enable/disable infinite scroll
}
```

## Performance

- **Initial Load**: ~50ms (indexed queries)
- **Scroll Load**: ~50ms per 50 records
- **Total Records**: 100,000
- **Indexed Columns**: 11 frequently queried columns

## Testing

Test the API directly:

```bash
# Basic query
curl "http://localhost:3001/api/enterprise-orders/paginated?skip=0&limit=10"

# With sorting
curl "http://localhost:3001/api/enterprise-orders/paginated?skip=0&limit=10&sort=%5B%7B%22columnKey%22%3A%22order_date%22%2C%22direction%22%3A%22desc%22%7D%5D"

# With filters (VIP customers)
curl -G "http://localhost:3001/api/enterprise-orders/paginated" \
  --data-urlencode 'skip=0' \
  --data-urlencode 'limit=10' \
  --data-urlencode 'filter={"is_vip_customer":{"type":"boolean","value":true}}'
```

## Next Steps

- [ ] Add filtering UI component
- [ ] Add export to CSV functionality
- [ ] Add charts/analytics view
- [ ] Add detail view for individual orders
- [ ] Implement real-time updates

## Related Documentation

- Database setup: `/home/lucio/workspace/db/ENTERPRISE_ORDERS_README.md`
- Quick start: `/home/lucio/workspace/db/QUICK_START.md`
- Column reference: `/home/lucio/workspace/db/COLUMNS_REFERENCE.md`
- System overview: `/home/lucio/workspace/db/SYSTEM_OVERVIEW.md`
