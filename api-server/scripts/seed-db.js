const { spawnSync } = require('node:child_process');

const env = {
  ...process.env,
  PGPASSWORD: process.env.DB_PASSWORD ?? 'root',
};

const host = process.env.DB_HOST ?? 'localhost';
const port = process.env.DB_PORT ?? '5434';
const user = process.env.DB_USER ?? 'root';
const database = process.env.DB_NAME ?? 'car_sales_db';

const runSqlFile = (sqlFilePath) => {
  const result = spawnSync(
    'psql',
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

  runSqlFile('db/setup_large_data.sql');
  runSqlFile('db/setup_enterprise_orders.sql');

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
