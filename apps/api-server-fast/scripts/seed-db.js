const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');

const SAFE_PATH =
  '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';

const FIXED_PSQL_PATHS = ['/usr/local/bin/psql', '/usr/bin/psql', '/bin/psql'];

const resolvePsqlBinary = () => {
  const matchedPath = FIXED_PSQL_PATHS.find((path) => existsSync(path));

  if (!matchedPath) {
    throw new Error(
      `psql binary was not found in fixed directories: ${FIXED_PSQL_PATHS.join(', ')}`,
    );
  }

  return matchedPath;
};

const env = {
  PATH: SAFE_PATH,
  PGPASSWORD: process.env.DB_PASSWORD ?? 'root',
};

const psqlBinary = resolvePsqlBinary();

const host = process.env.DB_HOST ?? 'localhost';
const port = process.env.DB_PORT ?? '5434';
const user = process.env.DB_USER ?? 'root';
const database = process.env.DB_NAME ?? 'car_sales_db';

const runSqlFile = (sqlFilePath) => {
  const result = spawnSync(
    psqlBinary,
    ['-h', host, '-p', port, '-U', user, '-d', database, '-f', sqlFilePath],
    {
      env,
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`psql exited with status ${result.status}`);
  }
};

const main = () => {
  console.log('🌱 Seeding database...');
  console.log(`   host=${host} port=${port} db=${database} user=${user}`);

  runSqlFile('../api-server/db/setup_large_data.sql');
  runSqlFile('../api-server/db/setup_enterprise_orders.sql');

  console.log('✅ Seeding finished successfully');
};

try {
  main();
} catch (error) {
  console.error(
    '❌ Seeding failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
