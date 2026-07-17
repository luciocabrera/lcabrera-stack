const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const SAFE_PATH =
  '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';

const FIXED_PSQL_PATHS = ['/usr/local/bin/psql', '/usr/bin/psql', '/bin/psql'];
const FIXED_DOCKER_PATHS = [
  '/usr/local/bin/docker',
  '/usr/bin/docker',
  '/bin/docker',
];
const DEFAULT_DOCKER_CONTAINER = 'postgres_container';

const resolveBinaryFromFixedPaths = ({ candidatePaths, name }) => {
  const matchedPath = candidatePaths.find((candidatePath) =>
    existsSync(candidatePath),
  );

  if (!matchedPath) {
    throw new Error(
      `${name} binary was not found in fixed directories: ${candidatePaths.join(', ')}`,
    );
  }

  return matchedPath;
};

const env = {
  PATH: SAFE_PATH,
  PGPASSWORD: process.env.DB_PASSWORD ?? 'root',
};

const psqlBinary = FIXED_PSQL_PATHS.find((candidatePath) =>
  existsSync(candidatePath),
);
const createdbBinary = psqlBinary
  ? path.join(path.dirname(psqlBinary), 'createdb')
  : undefined;

const dockerBinary = psqlBinary
  ? undefined
  : resolveBinaryFromFixedPaths({
      candidatePaths: FIXED_DOCKER_PATHS,
      name: 'docker',
    });

const host = process.env.DB_HOST ?? 'localhost';
const port = process.env.DB_PORT ?? '5434';
const user = process.env.DB_USER ?? 'root';
const database = process.env.DB_NAME ?? 'car_sales_db';
const dockerContainer =
  process.env.DB_DOCKER_CONTAINER ?? DEFAULT_DOCKER_CONTAINER;

const repositoryRoot = path.resolve(__dirname, '..');
const sqlFilePaths = [
  path.join(repositoryRoot, 'apps/api-server/db/setup_large_data.sql'),
  path.join(repositoryRoot, 'apps/api-server/db/setup_enterprise_orders.sql'),
];

const runSqlFile = (sqlFilePath) => {
  const result = psqlBinary
    ? spawnSync(
        psqlBinary,
        ['-h', host, '-p', port, '-U', user, '-d', database, '-f', sqlFilePath],
        {
          env,
          stdio: 'inherit',
        },
      )
    : spawnSync(
        dockerBinary,
        [
          'exec',
          '-i',
          dockerContainer,
          'psql',
          '-U',
          user,
          '-d',
          database,
          '-v',
          'ON_ERROR_STOP=1',
        ],
        {
          env,
          input: readFileSync(sqlFilePath),
          stdio: ['pipe', 'inherit', 'inherit'],
        },
      );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`psql exited with status ${result.status}`);
  }
};

const assertSafeDatabaseName = (name) => {
  const isSafeName = /^[A-Za-z_]\w*$/.test(name);

  if (!isSafeName) {
    throw new Error(
      `Unsafe DB_NAME '${name}'. Only letters, numbers, and underscores are allowed.`,
    );
  }
};

const ensureDatabaseExists = () => {
  assertSafeDatabaseName(database);

  const checkResult = psqlBinary
    ? spawnSync(
        psqlBinary,
        [
          '-h',
          host,
          '-p',
          port,
          '-U',
          user,
          '-d',
          'postgres',
          '-tAc',
          `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
        ],
        {
          env,
          stdio: ['inherit', 'pipe', 'inherit'],
        },
      )
    : spawnSync(
        dockerBinary,
        [
          'exec',
          '-i',
          dockerContainer,
          'psql',
          '-U',
          user,
          '-d',
          'postgres',
          '-tAc',
          `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
        ],
        {
          env,
          stdio: ['inherit', 'pipe', 'inherit'],
        },
      );

  if (checkResult.error) {
    throw checkResult.error;
  }

  if (checkResult.status !== 0) {
    throw new Error(`psql exited with status ${checkResult.status}`);
  }

  const databaseExists = checkResult.stdout.toString().trim() === '1';

  if (databaseExists) {
    return;
  }

  const createResult = psqlBinary
    ? spawnSync(
        createdbBinary,
        ['-h', host, '-p', port, '-U', user, database],
        {
          env,
          stdio: 'inherit',
        },
      )
    : spawnSync(
        dockerBinary,
        ['exec', '-i', dockerContainer, 'createdb', '-U', user, database],
        {
          env,
          stdio: ['inherit', 'inherit', 'inherit'],
        },
      );

  if (createResult.error) {
    throw createResult.error;
  }

  if (createResult.status !== 0) {
    throw new Error(`createdb exited with status ${createResult.status}`);
  }

  console.log(`   created database: ${database}`);
};

const main = () => {
  console.log('Seeding database...');
  console.log(`   host=${host} port=${port} db=${database} user=${user}`);
  const mode = psqlBinary ? 'host-psql' : `docker-exec(${dockerContainer})`;
  console.log(`   mode=${mode}`);

  ensureDatabaseExists();

  sqlFilePaths.forEach((sqlFilePath) => {
    runSqlFile(sqlFilePath);
  });

  console.log('Seeding finished successfully');
};

try {
  main();
} catch (error) {
  console.error(
    'Seeding failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
