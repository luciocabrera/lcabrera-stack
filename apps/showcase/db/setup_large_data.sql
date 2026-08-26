SET client_min_messages TO warning;
SET statement_timeout = 0;
SET lock_timeout = '10s';
SET synchronous_commit = off;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS car_sales;
CREATE TABLE car_sales (
  car_id integer PRIMARY KEY,
  date_of_ingress date NOT NULL,
  date_of_sale date NOT NULL,
  model varchar(100) NOT NULL,
  year integer NOT NULL,
  color varchar(30) NOT NULL,
  engine varchar(50) NOT NULL,
  transmission varchar(50) NOT NULL,
  fuel_type varchar(30) NOT NULL,
  mileage integer NOT NULL,
  purchase_price numeric(12,2) NOT NULL,
  sale_price numeric(12,2) NOT NULL,
  profit numeric(12,2) NOT NULL,
  loan_provider varchar(120) NOT NULL,
  loan_amount numeric(12,2) NOT NULL,
  insurance_provider varchar(120) NOT NULL,
  insurance_policy_number varchar(64) NOT NULL,
  insurance_expiration_date date NOT NULL,
  seller_name varchar(120) NOT NULL,
  seller_email varchar(180) NOT NULL,
  seller_phone varchar(30) NOT NULL,
  seller_address varchar(250) NOT NULL,
  buyer_name varchar(120) NOT NULL,
  buyer_email varchar(180) NOT NULL,
  buyer_phone varchar(30) NOT NULL,
  buyer_address varchar(250) NOT NULL,
  city varchar(120),
  state varchar(120),
  postal_code varchar(20),
  country varchar(120)
);

INSERT INTO car_sales (
  car_id,
  date_of_ingress,
  date_of_sale,
  model,
  year,
  color,
  engine,
  transmission,
  fuel_type,
  mileage,
  purchase_price,
  sale_price,
  profit,
  loan_provider,
  loan_amount,
  insurance_provider,
  insurance_policy_number,
  insurance_expiration_date,
  seller_name,
  seller_email,
  seller_phone,
  seller_address,
  buyer_name,
  buyer_email,
  buyer_phone,
  buyer_address,
  city,
  state,
  postal_code,
  country
)
SELECT
  gs,
  DATE '2020-01-01' + (gs % 1200),
  DATE '2020-01-01' + (gs % 1200) + ((gs % 40) + 1),
  ('Model ' || ((gs % 350) + 1))::varchar(100),
  2000 + (gs % 26),
  (ARRAY['Black','White','Silver','Blue','Red','Gray'])[1 + (gs % 6)]::varchar(30),
  (ARRAY['V4','V6','V8','Electric','Hybrid'])[1 + (gs % 5)]::varchar(50),
  (ARRAY['Automatic','Manual','CVT'])[1 + (gs % 3)]::varchar(50),
  (ARRAY['Gasoline','Diesel','Electric','Hybrid'])[1 + (gs % 4)]::varchar(30),
  (gs * 37) % 250000,
  (15000 + (gs % 85000))::numeric(12,2),
  (17000 + (gs % 90000))::numeric(12,2),
  ((17000 + (gs % 90000)) - (15000 + (gs % 85000)))::numeric(12,2),
  ('LoanBank ' || ((gs % 40) + 1))::varchar(120),
  (5000 + (gs % 45000))::numeric(12,2),
  ('InsuranceCo ' || ((gs % 30) + 1))::varchar(120),
  ('POL' || lpad(gs::text, 10, '0'))::varchar(64),
  DATE '2025-01-01' + (gs % 1200),
  ('Seller ' || gs)::varchar(120),
  ('seller' || gs || '@example.com')::varchar(180),
  ('+1-555-' || lpad((gs % 10000)::text, 4, '0'))::varchar(30),
  ('Seller Street ' || ((gs % 9999) + 1))::varchar(250),
  ('Buyer ' || gs)::varchar(120),
  ('buyer' || gs || '@example.com')::varchar(180),
  ('+1-666-' || lpad((gs % 10000)::text, 4, '0'))::varchar(30),
  ('Buyer Avenue ' || ((gs % 9999) + 1))::varchar(250),
  CASE WHEN gs % 20 = 0 THEN NULL ELSE ('City ' || ((gs % 300) + 1))::varchar(120) END,
  CASE WHEN gs % 25 = 0 THEN NULL ELSE ('State ' || ((gs % 80) + 1))::varchar(120) END,
  CASE WHEN gs % 30 = 0 THEN NULL ELSE lpad((gs % 99999)::text, 5, '0')::varchar(20) END,
  CASE WHEN gs % 35 = 0 THEN NULL ELSE ('Country ' || ((gs % 20) + 1))::varchar(120) END
FROM generate_series(1, 500000) AS gs;

CREATE INDEX idx_car_sales_date_of_sale ON car_sales(date_of_sale);
CREATE INDEX idx_car_sales_model ON car_sales(model);
CREATE INDEX idx_car_sales_city ON car_sales(city);
ANALYZE car_sales;

DROP TABLE IF EXISTS wide_alltypes_150;

DO $$
DECLARE
  sql text;
  i integer;
  typ text;
BEGIN
  sql := 'CREATE TABLE wide_alltypes_150 (id bigint PRIMARY KEY';

  FOR i IN 1..149 LOOP
    typ := CASE (i % 20)
      WHEN 0 THEN 'smallint'
      WHEN 1 THEN 'integer'
      WHEN 2 THEN 'bigint'
      WHEN 3 THEN 'numeric(20,4)'
      WHEN 4 THEN 'real'
      WHEN 5 THEN 'double precision'
      WHEN 6 THEN 'boolean'
      WHEN 7 THEN 'varchar(120)'
      WHEN 8 THEN 'text'
      WHEN 9 THEN 'date'
      WHEN 10 THEN 'time'
      WHEN 11 THEN 'timestamp'
      WHEN 12 THEN 'timestamptz'
      WHEN 13 THEN 'uuid'
      WHEN 14 THEN 'jsonb'
      WHEN 15 THEN 'bytea'
      WHEN 16 THEN 'inet'
      WHEN 17 THEN 'interval'
      WHEN 18 THEN 'point'
      ELSE 'integer[]'
    END;

    sql := sql || format(', c_%s %s', lpad(i::text, 3, '0'), typ);
  END LOOP;

  sql := sql || ')';
  EXECUTE sql;
END $$;

DO $$
DECLARE
  sql text;
  i integer;
  expr text;
BEGIN
  sql := 'INSERT INTO wide_alltypes_150 SELECT gs';

  FOR i IN 1..149 LOOP
    expr := CASE (i % 20)
      WHEN 0 THEN format('(gs %% 32767)::smallint')
      WHEN 1 THEN format('(gs * %s)::integer', i)
      WHEN 2 THEN format('(gs::bigint * %s)', i)
      WHEN 3 THEN format('((gs * %s)::numeric / 7.0)::numeric(20,4)', i)
      WHEN 4 THEN format('((gs %% 100000) / 3.0)::real')
      WHEN 5 THEN format('((gs %% 100000) / 7.0)::double precision')
      WHEN 6 THEN format('(gs %% 2 = 0)')
      WHEN 7 THEN format('(''vchar_%s_'' || gs)::varchar(120)', i)
      WHEN 8 THEN format('(''text_%s_'' || md5(gs::text))::text', i)
      WHEN 9 THEN format('(DATE ''2020-01-01'' + (gs %% 1825))')
      WHEN 10 THEN format('(TIME ''00:00:00'' + ((gs %% 86400) * INTERVAL ''1 second''))::time')
      WHEN 11 THEN format('(TIMESTAMP ''2020-01-01'' + (gs * INTERVAL ''1 second''))')
      WHEN 12 THEN format('(TIMESTAMPTZ ''2020-01-01 00:00:00+00'' + (gs * INTERVAL ''1 second''))')
      WHEN 13 THEN format('gen_random_uuid()')
      WHEN 14 THEN format('jsonb_build_object(''i'', %s, ''g'', gs, ''k'', ''row-'' || gs)', i)
      WHEN 15 THEN format('decode(md5(gs::text || ''-%s''), ''hex'')', i)
      WHEN 16 THEN format('(''10.'' || ((gs/65536) %% 250)::text || ''.'' || ((gs/256) %% 250)::text || ''.'' || (gs %% 250 + 1)::text)::inet')
      WHEN 17 THEN format('((gs %% 1000) * INTERVAL ''1 minute'')')
      WHEN 18 THEN format('point((gs %% 1000)::float8 / 10.0, ((gs * 3) %% 1000)::float8 / 10.0)')
      ELSE format('ARRAY[(gs %% 1000)::integer, ((gs * %s) %% 1000)::integer, ((gs * %s) %% 1000)::integer]', i, i + 7)
    END;

    sql := sql || ', ' || expr;
  END LOOP;

  sql := sql || ' FROM generate_series(1, 1000000) gs';
  EXECUTE sql;
END $$;

ANALYZE wide_alltypes_150;

SELECT 'car_sales' AS table_name, count(*) AS rows FROM car_sales
UNION ALL
SELECT 'wide_alltypes_150' AS table_name, count(*) AS rows FROM wide_alltypes_150;
