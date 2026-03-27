/**
 * Smoke test for the Fastify API server.
 *
 * Usage: Start the server in a separate terminal, then run:
 *   node scripts/smoke-test.js [port]
 *
 * Default port: 3002
 */

const port = process.argv[2] || "3002";
const BASE = `http://localhost:${port}`;

async function runTests() {
  const results = [];

  const test = async (label, url, check) => {
    try {
      const response = await fetch(url);
      const body = await response.json();
      const detail = check(response, body);
      results.push(`✅ ${label}: ${response.status} ${detail}`);
    } catch (error) {
      results.push(`❌ ${label}: ${error.message}`);
    }
  };

  await test("db-sanity", `${BASE}/api/db-sanity`, (_r, b) => `healthy=${b.isHealthy}`);
  await test("car-sales getAll", `${BASE}/api/car-sales`, (_r, b) => `total=${b.total}`);
  await test(
    "car-sales paginated",
    `${BASE}/api/car-sales/paginated?skip=0&limit=2`,
    (_r, b) => `rows=${b.data?.length} total=${b.total}`,
  );
  await test(
    "enterprise-orders paginated",
    `${BASE}/api/enterprise-orders/paginated?skip=0&limit=3`,
    (_r, b) => `rows=${b.data?.length} total=${b.total}`,
  );
  await test(
    "enterprise-orders by id",
    `${BASE}/api/enterprise-orders/1`,
    (_r, b) => `hasData=${!!b.data}`,
  );
  await test(
    "distinct order_status",
    `${BASE}/api/enterprise-orders/distinct/order_status?limit=5`,
    (_r, b) => `values=${b.values?.length} hasMore=${b.hasMore}`,
  );
  await test(
    "wide-alltypes paginated",
    `${BASE}/api/wide-alltypes-150/paginated?skip=0&limit=3`,
    (_r, b) => `rows=${b.data?.length}`,
  );
  await test("404 handler", `${BASE}/nonexistent`, (_r, b) => `error=${b.error}`);
  await test(
    "invalid sort (schema)",
    `${BASE}/api/car-sales/paginated?sort=invalid`,
    (_r, _b) => `(expect 400)`,
  );

  console.log(results.join("\n"));
}

void runTests();
