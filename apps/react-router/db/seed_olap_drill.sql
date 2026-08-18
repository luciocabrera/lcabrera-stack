-- Additive OLAP/drill fixture for `enterprise_orders`.
--
-- WHY THIS EXISTS
--
-- `setup_enterprise_orders.sql` derives every dimension from the same
-- `generate_series` counter, so the dimensions are correlated: each
-- (product_category, product_subcategory, customer_type) cell holds exactly
-- **one** customer_name, and every leaf group of that four-key grouping comes
-- out large, and within a narrow band of every other. Two consequences make
-- drilling untestable on it:
--
--   * adding `customer_name` as a fourth key changes nothing — the group count
--     is identical to grouping by three;
--   * every leaf group is far past a page, so a drill always ends in the
--     hand-off row and the "fits in one page" path is never exercised.
--
-- This script adds rows whose dimensions are drawn from **independent** hashes
-- of the row id, with a customer pool whose size varies by category, so leaf
-- group sizes span orders of magnitude and all three drill outcomes occur: a
-- group that fits one page, one that needs several, and one past the hand-off.
-- #788 records the distribution measured when this landed — re-measure rather
-- than trusting a number written here, which nothing checks.
--
-- IT IS ADDITIVE. The batch starts after the highest order_id already present,
-- so no existing row is written and every count and total already recorded
-- against whatever is in the table still holds. Run it as many times as you
-- like: each run appends a fresh batch after the last.
--
--   docker exec -i <container> psql -U <user> -d <db> < seed_olap_drill.sql
--
-- **No `psql` meta-command anywhere**, which is a constraint this directory
-- imposes rather than a style: `scripts/seed-db.mjs` applies `db/*.sql` through
-- `pg`, so a `\set`, `\if` or `\gset` here would work under `psql` and fail
-- under the seeder. That is why the batch size is a literal in the `anchor` CTE
-- below — edit it there — and why the id it starts from is read in SQL rather
-- than passed in with `-v`.
--
-- Each batch on its own has the group-size spread described above; stacking
-- batches multiplies every leaf group, so drill against one batch's id range
-- when the spread is what you are testing.
--
-- To undo, delete by customer id rather than by order id:
--
--   DELETE FROM enterprise_orders WHERE customer_id >= 900000;
--
-- Every row this file writes carries `900000 + <pool slot>`, and the base seed's
-- customer ids sit far below that, so the statement removes exactly the appended
-- batches however many there are. An `order_id > 500000` bound would instead
-- depend on the base seed's row count, and would silently delete base-seed rows
-- if that count ever dropped.

SET client_min_messages TO warning;
SET statement_timeout = 0;
SET lock_timeout = '10s';
SET synchronous_commit = off;

INSERT INTO enterprise_orders (
  order_id, order_number, order_date, order_status, priority,
  customer_id, customer_name, customer_email, customer_phone, customer_type,
  is_vip_customer, loyalty_points, customer_since, customer_rating,
  total_amount, subtotal, tax_amount, shipping_cost, discount_amount, discount_percentage,
  unit_price, quantity, paid_amount, balance_due,
  payment_status, payment_method, payment_date, payment_reference,
  product_category, product_subcategory,
  shipping_address_line1, shipping_address_line2,
  shipping_city, shipping_state, shipping_country, shipping_postal_code,
  carrier, tracking_number, warehouse_location,
  is_rush_order, is_gift, is_fragile, requires_signature,
  shipped_date, delivery_date, estimated_delivery_days,
  weight_kg, volume_m3,
  billing_address_line1, billing_city, billing_state, billing_country, billing_postal_code,
  order_timestamp, order_notes, internal_notes,
  last_modified_by, created_at, updated_at
)
WITH anchor AS (
  -- The high-water mark, read rather than hardcoded, so a second run appends
  -- instead of colliding with the first run's primary keys. `batch_rows` is the
  -- one number to edit; it is a literal because this file may carry no `psql`
  -- variable (see the header).
  SELECT COALESCE(max(order_id), 0) AS start_id, 500000 AS batch_rows
  FROM enterprise_orders
),
hashed AS (
  -- One independent hash per dimension. Salting the digest is what breaks the
  -- correlation the base seed has: every dimension below varies on its own.
  SELECT
    gs,
    ('x' || substr(md5('cat'  || gs), 1, 7))::bit(28)::int AS h_cat,
    ('x' || substr(md5('sub'  || gs), 1, 7))::bit(28)::int AS h_sub,
    ('x' || substr(md5('type' || gs), 1, 7))::bit(28)::int AS h_type,
    ('x' || substr(md5('stat' || gs), 1, 7))::bit(28)::int AS h_stat,
    ('x' || substr(md5('cust' || gs), 1, 7))::bit(28)::int AS h_cust,
    ('x' || substr(md5('rate' || gs), 1, 7))::bit(28)::int AS h_rate,
    ('x' || substr(md5('date' || gs), 1, 7))::bit(28)::int AS h_date,
    ('x' || substr(md5('money'|| gs), 1, 7))::bit(28)::int AS h_money,
    ('x' || substr(md5('geo'  || gs), 1, 7))::bit(28)::int AS h_geo
  FROM anchor,
       LATERAL generate_series(
         anchor.start_id + 1,
         anchor.start_id + anchor.batch_rows
       ) AS gs
),
dimensioned AS (
  SELECT
    h.*,
    (ARRAY['Automotive','Books','Clothing','Electronics','Food',
           'Furniture','Garden','Health','Sports','Toys'])[1 + h_cat % 10] AS category,
    1 + h_sub % 8 AS sub_idx,
    (ARRAY['Business','Corporate','Government','Individual','Non-Profit'])[1 + h_type % 5] AS cust_type,
    (ARRAY['Cancelled','Delivered','On Hold','Pending',
           'Processing','Refunded','Returned','Shipped'])[1 + h_stat % 8] AS status,
    (ARRAY['Critical','High','Low','Normal','Urgent'])[1 + h_stat % 5] AS prio,
    -- The customer pool widens by category, so leaf-group size spans two
    -- orders of magnitude and a drill meets every outcome: comfortably inside
    -- one page, near it, and past it.
    (ARRAY[3, 5, 8, 12, 20, 30, 50, 80, 150, 300])[1 + h_cat % 10] AS pool,
    (ARRAY['Amazon Logistics','DHL','FedEx','UPS','USPS'])[1 + h_geo % 5] AS carrier_val,
    (ARRAY['Warehouse A','Warehouse B','Warehouse C','Warehouse D','Warehouse E'])[1 + h_geo % 5] AS wh_loc,
    (ARRAY['Austin','Charlotte','Chicago','Columbus','Dallas','Denver','Fort Worth','Houston',
           'Indianapolis','Jacksonville','Los Angeles','Nashville','New York','Philadelphia',
           'Phoenix','San Antonio','San Diego','San Francisco','San Jose','Seattle'])[1 + h_geo % 20] AS city,
    (ARRAY['AZ','CA','CO','FL','IL','IN','NC','NY','OH','PA','TN','TX','WA'])[1 + h_geo % 13] AS st,
    (ARRAY['Canada','UK','USA'])[1 + h_geo % 3] AS country,
    (ARRAY['Bank Transfer','Cash','Check','Credit Card',
           'Cryptocurrency','Debit Card','PayPal'])[1 + h_money % 7] AS pay_method,
    (ARRAY['Cancelled','Failed','Paid','Partially Paid','Pending','Refunded'])[1 + h_money % 6] AS pay_status,
    (ARRAY['admin','billing_dept','cs_rep','manager','ops_team'])[1 + h_geo % 5] AS modified_by,
    DATE '2021-01-01' + (h_date % 1800) AS ord_date
  FROM hashed AS h
),
named AS (
  SELECT
    d.*,
    -- A name index inside the category's pool, offset per category so two
    -- categories do not share the same customers wholesale.
    ((d.h_cust % d.pool) + (d.h_cat % 10) * 37) % 400 AS cust_slot,
    CASE d.category
      WHEN 'Electronics' THEN (ARRAY['Smartphones','Laptops','Tablets','Cameras','Audio','TVs','Wearables','Gaming'])[d.sub_idx]
      WHEN 'Clothing'    THEN (ARRAY['Shirts','Pants','Shoes','Jackets','Dresses','Accessories','Sportswear','Underwear'])[d.sub_idx]
      WHEN 'Food'        THEN (ARRAY['Beverages','Snacks','Dairy','Produce','Meat','Bakery','Canned Goods','Frozen'])[d.sub_idx]
      WHEN 'Books'       THEN (ARRAY['Fiction','Non-Fiction','Science','History','Art','Technology','Business','Children'])[d.sub_idx]
      WHEN 'Furniture'   THEN (ARRAY['Sofas','Tables','Chairs','Beds','Storage','Desks','Lighting','Rugs'])[d.sub_idx]
      WHEN 'Sports'      THEN (ARRAY['Fitness','Outdoor','Team Sports','Water Sports','Cycling','Running','Combat Sports','Winter Sports'])[d.sub_idx]
      WHEN 'Toys'        THEN (ARRAY['Action Figures','Board Games','Dolls','Educational','Electronic Toys','Outdoor Play','Puzzles','Remote Control'])[d.sub_idx]
      WHEN 'Health'      THEN (ARRAY['Vitamins','Personal Care','Medical','Fitness Equipment','Nutrition','Skincare','Dental','Vision'])[d.sub_idx]
      WHEN 'Automotive'  THEN (ARRAY['Accessories','Tools','Electronics','Interior','Exterior','Tires','Lighting','Performance'])[d.sub_idx]
      ELSE                    (ARRAY['Plants','Tools','Furniture','Lighting','Irrigation','Pots','Seeds','Decor'])[d.sub_idx]
    END AS subcategory
  FROM dimensioned AS d
),
financial AS (
  SELECT
    n.*,
    900000 + n.cust_slot AS cust_id,
    (ARRAY['James','Emma','Liam','Olivia','Noah','Ava','William','Sophia','Oliver','Isabella',
           'Ethan','Mia','Lucas','Amelia','Mason','Harper','Logan','Evelyn','Aiden','Abigail'])[1 + n.cust_slot % 20]
      || ' ' ||
    (ARRAY['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor',
           'Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Young','Lee'])[1 + (n.cust_slot / 20) % 20]
      AS cust_name,
    1 + n.h_money % 10 AS qty,
    ROUND((500 + (n.h_money % 450000) / 100.0)::numeric, 2) AS unit_p,
    (n.h_money % 21)::numeric(5,2) AS disc_pct,
    ROUND((5 + (n.h_geo % 4500) / 100.0)::numeric, 2) AS ship_cost
  FROM named AS n
),
priced AS (
  SELECT
    f.*,
    ROUND(f.unit_p * f.qty, 2) AS subtotal_v
  FROM financial AS f
),
totalled AS (
  SELECT
    p.*,
    ROUND(p.subtotal_v * p.disc_pct / 100, 2) AS disc_amt,
    ROUND((p.subtotal_v - ROUND(p.subtotal_v * p.disc_pct / 100, 2)) * 0.08, 2) AS tax_v
  FROM priced AS p
),
final AS (
  SELECT
    t.*,
    (t.subtotal_v - t.disc_amt + t.tax_v + t.ship_cost) AS total_v
  FROM totalled AS t
)
SELECT
  gs,
  'ORD-' || lpad(gs::text, 8, '0'),
  ord_date,
  status,
  prio,
  cust_id,
  cust_name,
  'customer' || cust_id || '@example.com',
  '+1-' || lpad(((h_geo % 900) + 100)::text, 3, '0') || '-' || lpad((h_geo % 10000)::text, 4, '0'),
  cust_type,
  (h_rate % 5 = 0),
  (h_rate % 10000),
  DATE '2010-01-01' + (h_rate % 4380),
  -- A sixth of every dimension cell is NULL, so a NULL group key is a group
  -- worth drilling rather than a stray row.
  CASE WHEN h_rate % 6 = 0 THEN NULL
       ELSE ROUND((1.0 + (h_rate % 9) * 0.5)::numeric, 1)
  END,
  total_v,
  subtotal_v,
  tax_v,
  ship_cost,
  disc_amt,
  disc_pct,
  unit_p,
  qty,
  CASE pay_status
    WHEN 'Paid'           THEN total_v
    WHEN 'Partially Paid' THEN ROUND(total_v / 2, 2)
    ELSE 0
  END,
  total_v - CASE pay_status
    WHEN 'Paid'           THEN total_v
    WHEN 'Partially Paid' THEN ROUND(total_v / 2, 2)
    ELSE 0
  END,
  pay_status,
  pay_method,
  CASE WHEN pay_status IN ('Paid', 'Partially Paid') THEN ord_date + (h_money % 5) + 1 END,
  CASE WHEN h_money % 8 = 0 THEN NULL ELSE 'REF-' || lpad(gs::text, 10, '0') END,
  category,
  subcategory,
  gs::text || ' Commerce Street',
  CASE WHEN h_geo % 10 = 0 THEN 'Suite ' || ((h_geo % 500) + 1) END,
  city,
  st,
  country,
  lpad((h_geo % 99999)::text, 5, '0'),
  carrier_val,
  CASE WHEN status IN ('Shipped','Delivered','Returned','Refunded')
       THEN 'TRK' || lpad(gs::text, 12, '0')
  END,
  wh_loc,
  (h_date % 7 = 0),
  (h_date % 9 = 0),
  (h_date % 11 = 0),
  (h_date % 6 = 0),
  CASE WHEN status IN ('Shipped','Delivered','Returned','Refunded')
       THEN ord_date + (h_date % 7) + 1
  END,
  CASE WHEN status IN ('Delivered','Returned','Refunded')
       THEN ord_date + (h_date % 7) + (h_date % 5) + 2
  END,
  1 + h_date % 14,
  ROUND((0.2 + (h_money % 5000) / 100.0)::numeric, 2),
  ROUND((0.001 + (h_money % 20000) / 10000.0)::numeric, 4),
  gs::text || ' Billing Avenue',
  city,
  st,
  country,
  lpad((h_geo % 99999)::text, 5, '0'),
  ((ord_date::timestamp AT TIME ZONE 'UTC')
     + ((h_date % 86400) * interval '1 second')),
  CASE WHEN h_date % 13 = 0 THEN 'Customer requested a delivery window.' END,
  CASE WHEN h_date % 17 = 0 THEN 'Flagged for margin review.' END,
  modified_by,
  ord_date::timestamp,
  ord_date::timestamp + interval '1 day'
FROM final;
