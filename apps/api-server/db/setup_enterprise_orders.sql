\timing on
SET client_min_messages TO warning;
SET statement_timeout = 0;
SET lock_timeout = '10s';
SET synchronous_commit = off;

DROP TABLE IF EXISTS enterprise_orders;

CREATE TABLE enterprise_orders (
  order_id                 integer          PRIMARY KEY,
  order_number             varchar(50)      NOT NULL,
  order_date               date             NOT NULL,
  order_status             varchar(50)      NOT NULL,
  priority                 varchar(50)      NOT NULL,
  customer_id              integer          NOT NULL,
  customer_name            varchar(200)     NOT NULL,
  customer_email           varchar(200)     NOT NULL,
  customer_phone           varchar(30)      NOT NULL,
  customer_type            varchar(50)      NOT NULL,
  is_vip_customer          boolean          NOT NULL,
  loyalty_points           integer          NOT NULL,
  customer_since           date             NOT NULL,
  customer_rating          numeric(3,1),
  total_amount             numeric(12,2)    NOT NULL,
  subtotal                 numeric(12,2)    NOT NULL,
  tax_amount               numeric(12,2)    NOT NULL,
  shipping_cost            numeric(12,2)    NOT NULL,
  discount_amount          numeric(12,2)    NOT NULL,
  discount_percentage      numeric(5,2)     NOT NULL,
  unit_price               numeric(12,2)    NOT NULL,
  quantity                 integer          NOT NULL,
  paid_amount              numeric(12,2)    NOT NULL,
  balance_due              numeric(12,2)    NOT NULL,
  payment_status           varchar(50)      NOT NULL,
  payment_method           varchar(50)      NOT NULL,
  payment_date             date,
  payment_reference        varchar(100),
  product_category         varchar(100)     NOT NULL,
  product_subcategory      varchar(100)     NOT NULL,
  shipping_address_line1   varchar(200)     NOT NULL,
  shipping_address_line2   varchar(200),
  shipping_city            varchar(100)     NOT NULL,
  shipping_state           varchar(100)     NOT NULL,
  shipping_country         varchar(100)     NOT NULL,
  shipping_postal_code     varchar(20)      NOT NULL,
  carrier                  varchar(100)     NOT NULL,
  tracking_number          varchar(100),
  warehouse_location       varchar(100)     NOT NULL,
  is_rush_order            boolean          NOT NULL,
  is_gift                  boolean          NOT NULL,
  is_fragile               boolean          NOT NULL,
  requires_signature       boolean          NOT NULL,
  shipped_date             date,
  delivery_date            date,
  estimated_delivery_days  integer          NOT NULL,
  weight_kg                numeric(8,2)     NOT NULL,
  volume_m3                numeric(10,4)    NOT NULL,
  billing_address_line1    varchar(200)     NOT NULL,
  billing_city             varchar(100)     NOT NULL,
  billing_state            varchar(100)     NOT NULL,
  billing_country          varchar(100)     NOT NULL,
  billing_postal_code      varchar(20)      NOT NULL,
  order_timestamp          timestamptz      NOT NULL,
  order_notes              text,
  internal_notes           text,
  last_modified_by         varchar(200)     NOT NULL,
  created_at               timestamp        NOT NULL,
  updated_at               timestamp        NOT NULL
);

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
WITH constants AS (
  SELECT
    'Automotive'::text AS category_automotive,
    'Books'::text AS category_books,
    'Clothing'::text AS category_clothing,
    'Electronics'::text AS category_electronics,
    'Pending'::text AS status_pending,
    'Food'::text AS category_food,
    'Garden'::text AS category_garden,
    'Health'::text AS category_health,
    'Shipped'::text AS status_shipped,
    'Sports'::text AS category_sports,
    'Toys'::text AS category_toys,
    'Delivered'::text AS status_delivered,
    'Returned'::text AS status_returned,
    'Refunded'::text AS status_refunded,
    'Lighting'::text AS subcategory_lighting,
    'Partially Paid'::text AS payment_status_partially_paid,
    'Individual'::text AS customer_type_individual,
    'Business'::text AS customer_type_business,
    'Furniture'::text AS category_furniture,
    TIMESTAMPTZ '2021-01-01 00:00:00 UTC' AS base_timestamptz,
    TIMESTAMP '2021-01-01 00:00:00' AS base_timestamp
),
constants_with_arrays AS (
  SELECT
    c.category_automotive,
    c.category_books,
    c.category_clothing,
    c.category_electronics,
    c.category_food,
    c.category_furniture,
    c.category_garden,
    c.category_health,
    c.category_sports,
    c.category_toys,
    c.status_pending,
    c.status_shipped,
    c.status_delivered,
    c.status_returned,
    c.status_refunded,
    c.subcategory_lighting,
    c.payment_status_partially_paid,
    c.customer_type_individual,
    c.customer_type_business,
    c.base_timestamptz,
    c.base_timestamp,
    ARRAY[
      c.category_electronics,
      c.category_clothing,
      c.category_food,
      c.category_books,
      c.category_furniture,
      c.category_sports,
      c.category_toys,
      c.category_health,
      c.category_automotive,
      c.category_garden
    ] AS category_values
  FROM constants AS c
),
base AS (
  SELECT
    c.category_automotive,
    c.category_books,
    c.category_clothing,
    c.category_electronics,
    c.category_food,
    gs,
    c.category_garden,
    c.category_health,
    c.category_sports,
    c.category_toys,
    c.status_pending,
    c.status_shipped,
    c.status_delivered,
    c.status_returned,
    c.status_refunded,
    c.subcategory_lighting,
    c.payment_status_partially_paid,
    c.category_furniture,
    c.category_values,
    c.base_timestamptz,
    c.base_timestamp,
    -- Status distribution: Delivered ~31%, Shipped ~19%, Pending/Processing ~12.5% each, rest 6%
    CASE (gs % 16)
      WHEN 0  THEN c.status_pending
      WHEN 1  THEN c.status_pending
      WHEN 2  THEN 'Processing'
      WHEN 3  THEN 'Processing'
      WHEN 4  THEN c.status_shipped
      WHEN 5  THEN c.status_shipped
      WHEN 6  THEN c.status_shipped
      WHEN 7  THEN c.status_delivered
      WHEN 8  THEN c.status_delivered
      WHEN 9  THEN c.status_delivered
      WHEN 10 THEN c.status_delivered
      WHEN 11 THEN 'Cancelled'
      WHEN 12 THEN c.status_returned
      WHEN 13 THEN c.status_refunded
      WHEN 14 THEN 'On Hold'
      ELSE         c.status_delivered
    END AS status,
    (ARRAY['Low','Normal','Normal','High','High','Urgent','Critical'])[1 + (gs % 7)] AS prio,
    (ARRAY['Credit Card','Debit Card','PayPal','Bank Transfer','Cash','Check','Cryptocurrency'])[1 + (gs % 7)] AS pay_method,
    CASE (gs % 12)
      WHEN 0 THEN c.status_pending
      WHEN 1 THEN c.status_pending
      WHEN 2 THEN 'Paid'
      WHEN 3 THEN 'Paid'
      WHEN 4 THEN 'Paid'
      WHEN 5 THEN 'Paid'
      WHEN 6 THEN 'Paid'
      WHEN 7 THEN 'Paid'
      WHEN 8 THEN c.payment_status_partially_paid
      WHEN 9 THEN 'Failed'
      WHEN 10 THEN c.status_refunded
      ELSE        'Cancelled'
    END AS pay_status,
    (gs % 100000) + 1 AS cust_id,
    (ARRAY[c.customer_type_individual,c.customer_type_individual,c.customer_type_business,c.customer_type_business,'Corporate','Government','Non-Profit'])[1 + (gs % 7)] AS cust_type,
    c.category_values[1 + (gs % 10)] AS category,
    (gs % 8) + 1 AS sub_idx,
    (ARRAY['FedEx','UPS','DHL','USPS','Amazon Logistics'])[1 + (gs % 5)] AS carrier_val,
    (ARRAY['Warehouse A','Warehouse B','Warehouse C','Warehouse D','Warehouse E'])[1 + (gs % 5)] AS wh_loc,
    (ARRAY['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose',
           'Austin','Jacksonville','Fort Worth','Columbus','Charlotte','Indianapolis','San Francisco','Seattle','Denver','Nashville'])[1 + (gs % 20)] AS ship_city,
    (ARRAY['NY','CA','IL','TX','AZ','PA','TX','CA','TX','CA',
           'TX','FL','TX','OH','NC','IN','CA','WA','CO','TN'])[1 + (gs % 20)] AS ship_st,
    (ARRAY['USA','USA','USA','USA','USA','USA','USA','Canada','Canada','UK'])[1 + (gs % 10)] AS ship_cty,
    -- Pricing
    (10 + (gs * 13) % 4990)::numeric(12,2) AS unit_p,
    (1 + gs % 20) AS qty,
    (5 + gs % 50)::numeric(12,2) AS ship_cost,
    CASE WHEN gs % 10 = 0 THEN 15
         WHEN gs % 5  = 0 THEN 5
         WHEN gs % 3  = 0 THEN 2
         ELSE 0
    END AS disc_pct,
    -- Date: 4 years range starting 2021-01-01
    DATE '2021-01-01' + (gs % 1460) AS ord_date,
    (gs % 1460) * INTERVAL '1 day' + (gs % 86400) * INTERVAL '1 second' AS timestamp_offset_interval
  FROM generate_series(1, 500000) AS gs
  CROSS JOIN constants_with_arrays AS c
),
computed AS (
  SELECT
    *,
    (unit_p * qty)::numeric(12,2) AS subtotal_v,
    ((unit_p * qty * disc_pct) / 100.0)::numeric(12,2) AS disc_amt
  FROM base
),
financial AS (
  SELECT
    *,
    (((subtotal_v - disc_amt) * 0.08))::numeric(12,2) AS tax_v,
    ((subtotal_v - disc_amt) + ((subtotal_v - disc_amt) * 0.08) + ship_cost)::numeric(12,2) AS total_v
  FROM computed
),
payment_derived AS (
  SELECT
    *,
    CASE pay_status
      WHEN 'Paid'         THEN total_v
      WHEN payment_status_partially_paid THEN ROUND(total_v * 0.5, 2)
      ELSE 0::numeric(12,2)
    END AS paid_v
  FROM financial
)
SELECT
  gs AS order_id,
  'ORD-' || lpad(gs::text, 8, '0') AS order_number,
  ord_date AS order_date,
  status AS order_status,
  prio AS priority,
  cust_id AS customer_id,
  (ARRAY['James','Emma','Liam','Olivia','Noah','Ava','William','Sophia','Oliver','Isabella',
         'Ethan','Mia','Lucas','Amelia','Mason','Harper','Logan','Evelyn','Aiden','Abigail'])[1 + ((gs * 7) % 20)]
  || ' ' ||
  (ARRAY['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor',
         'Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Young','Lee'])[1 + ((gs * 11) % 20)]
    AS customer_name,
  'customer' || cust_id || '@example.com' AS customer_email,
  '+1-' || lpad(((gs % 900) + 100)::text, 3, '0') || '-' || lpad((gs % 10000)::text, 4, '0') AS customer_phone,
  cust_type AS customer_type,
  (gs % 5 = 0) AS is_vip_customer,
  (gs % 10000) AS loyalty_points,
  DATE '2010-01-01' + (gs % 4380) AS customer_since,
  CASE WHEN gs % 7 = 0 THEN NULL
       ELSE ROUND((1.0 + (gs % 9) * 0.5)::numeric, 1)
  END AS customer_rating,
  total_v AS total_amount,
  subtotal_v AS subtotal,
  tax_v AS tax_amount,
  ship_cost AS shipping_cost,
  disc_amt AS discount_amount,
  disc_pct::numeric(5,2) AS discount_percentage,
  unit_p AS unit_price,
  qty AS quantity,
  paid_v AS paid_amount,
  (total_v - paid_v) AS balance_due,
  pay_status AS payment_status,
  pay_method AS payment_method,
  CASE pay_status
    WHEN 'Paid'           THEN ord_date + (gs % 5) + 1
    WHEN payment_status_partially_paid THEN ord_date + (gs % 3) + 1
    ELSE NULL
  END AS payment_date,
  CASE WHEN gs % 8 = 0 THEN NULL
       ELSE 'REF-' || lpad(gs::text, 10, '0')
  END AS payment_reference,
  category AS product_category,
  CASE category
    WHEN category_electronics THEN (ARRAY['Smartphones','Laptops','Tablets','Cameras','Audio','TVs','Wearables','Gaming'])[sub_idx]
    WHEN category_clothing    THEN (ARRAY['Shirts','Pants','Shoes','Jackets','Dresses','Accessories','Sportswear','Underwear'])[sub_idx]
    WHEN category_food        THEN (ARRAY['Beverages','Snacks','Dairy','Produce','Meat','Bakery','Canned Goods','Frozen'])[sub_idx]
    WHEN category_books       THEN (ARRAY['Fiction','Non-Fiction','Science','History','Art','Technology','Business','Children'])[sub_idx]
    WHEN category_furniture THEN (ARRAY['Sofas','Tables','Chairs','Beds','Storage','Desks',subcategory_lighting,'Rugs'])[sub_idx]
    WHEN category_sports      THEN (ARRAY['Fitness','Outdoor','Team Sports','Water Sports','Cycling','Running','Combat Sports','Winter Sports'])[sub_idx]
    WHEN category_toys        THEN (ARRAY['Action Figures','Board Games','Dolls','Educational','Electronic Toys','Outdoor Play','Puzzles','Remote Control'])[sub_idx]
    WHEN category_health      THEN (ARRAY['Vitamins','Personal Care','Medical','Fitness Equipment','Nutrition','Skincare','Dental','Vision'])[sub_idx]
    WHEN category_automotive  THEN (ARRAY['Accessories','Tools','Electronics','Interior','Exterior','Tires',subcategory_lighting,'Performance'])[sub_idx]
    WHEN category_garden      THEN (ARRAY['Plants','Tools',category_furniture,subcategory_lighting,'Irrigation','Pots','Seeds','Decor'])[sub_idx]
    ELSE 'General'
  END AS product_subcategory,
  (gs::text || ' Commerce Street') AS shipping_address_line1,
  CASE WHEN gs % 10 = 0 THEN 'Suite ' || ((gs % 500) + 1) ELSE NULL END AS shipping_address_line2,
  ship_city AS shipping_city,
  ship_st AS shipping_state,
  ship_cty AS shipping_country,
  lpad((gs % 99999)::text, 5, '0') AS shipping_postal_code,
  carrier_val AS carrier,
    CASE WHEN status IN (status_shipped, status_delivered, status_returned, status_refunded)
       THEN 'TRK' || lpad(gs::text, 12, '0')
       ELSE NULL
  END AS tracking_number,
  wh_loc AS warehouse_location,
  (gs % 7 = 0) AS is_rush_order,
  (gs % 9 = 0) AS is_gift,
  (gs % 11 = 0) AS is_fragile,
  (gs % 6 = 0) AS requires_signature,
    CASE WHEN status IN (status_shipped, status_delivered, status_returned, status_refunded)
       THEN ord_date + (gs % 7) + 1
       ELSE NULL
  END AS shipped_date,
    CASE WHEN status = status_delivered
       THEN ord_date + (gs % 14) + 3
       ELSE NULL
  END AS delivery_date,
  (3 + gs % 14) AS estimated_delivery_days,
  ROUND((0.5 + (gs % 500) * 0.1)::numeric, 2) AS weight_kg,
  ROUND((0.001 + (gs % 100) * 0.001)::numeric, 4) AS volume_m3,
  (gs::text || ' Billing Boulevard') AS billing_address_line1,
  ship_city AS billing_city,
  ship_st AS billing_state,
  ship_cty AS billing_country,
  lpad((gs % 99999)::text, 5, '0') AS billing_postal_code,
  (base_timestamptz + timestamp_offset_interval) AS order_timestamp,
  CASE WHEN gs % 15 = 0 THEN 'Order note for #' || gs ELSE NULL END AS order_notes,
  CASE WHEN gs % 20 = 0 THEN 'Internal note #' || gs ELSE NULL END AS internal_notes,
  (ARRAY['admin','ops_team','billing_dept','cs_rep','manager'])[1 + (gs % 5)] AS last_modified_by,
  (base_timestamp + timestamp_offset_interval) AS created_at,
  (base_timestamp + timestamp_offset_interval + INTERVAL '1 hour') AS updated_at
FROM payment_derived;

CREATE INDEX idx_enterprise_orders_order_date   ON enterprise_orders(order_date);
CREATE INDEX idx_enterprise_orders_order_status  ON enterprise_orders(order_status);
CREATE INDEX idx_enterprise_orders_customer_id   ON enterprise_orders(customer_id);
CREATE INDEX idx_enterprise_orders_priority      ON enterprise_orders(priority);
CREATE INDEX idx_enterprise_orders_payment_status ON enterprise_orders(payment_status);
CREATE INDEX idx_enterprise_orders_product_cat   ON enterprise_orders(product_category);
ANALYZE enterprise_orders;

SELECT 'enterprise_orders' AS table_name, count(*) AS rows FROM enterprise_orders;
