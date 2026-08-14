/**
 * Applies this workspace's car-sales DDL (`db/`) to the local database.
 *
 * Why it lives here: the API workspaces own the car-sales dataset and are meant
 * to be able to seed it with nothing else present (#689) — the showcase seeds
 * its own copy from `apps/react-router/db/` through its own runner.
 *
 * It shells out rather than using `pg` because the database it seeds may not be
 * reachable the same way twice: a host `psql` is used when there is one,
 * otherwise the command is piped into the local container. Both spawn with a
 * fixed safe `PATH` and a binary resolved from fixed system directories, never
 * from the caller's `PATH`.
 *
 * Usage:
 *   vp run --filter car-sales-api seed        seed a running database
 *   vp run --filter car-sales-api db:seed     bring the database up, then seed
 *
 * Exit codes: 0 = seeded, 1 = env is incomplete, no client was found, or a
 * statement failed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAFE_PATH =
  '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';

const FIXED_PSQL_PATHS = ['/usr/local/bin/psql', '/usr/bin/psql', '/bin/psql'];
const FIXED_DOCKER_PATHS = [
  '/usr/local/bin/docker',
  '/usr/bin/docker',
  '/bin/docker',
];
const DEFAULT_DOCKER_CONTAINER = 'postgres_container';

const WORKSPACE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The car-sales tables both API servers serve; `db/` holds nothing else. */
const SQL_FILENAMES = ['setup_large_data.sql'];

const REQUIRED_ENV_KEYS = [
  'DB_HOST',
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
  'DB_USER',
];

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

const missingEnvKeys = (env) => REQUIRED_ENV_KEYS.filter((key) => !env[key]);

const readSettings = (env) => ({
  database: env.DB_NAME,
  dockerContainer: env.DB_DOCKER_CONTAINER ?? DEFAULT_DOCKER_CONTAINER,
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
});

const assertSafeDatabaseName = (name) => {
  const isSafeName = /^[A-Za-z_]\w*$/.test(name);

  if (!isSafeName) {
    throw new Error(
      `Unsafe DB_NAME '${name}'. Only letters, numbers, and underscores are allowed.`,
    );
  }
};

const psqlBinary = FIXED_PSQL_PATHS.find((candidatePath) =>
  existsSync(candidatePath),
);

const dockerBinary = psqlBinary
  ? undefined
  : resolveBinaryFromFixedPaths({
      candidatePaths: FIXED_DOCKER_PATHS,
      name: 'docker',
    });

const assertSpawned = ({ command, result }) => {
  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
};

/**
 * Without this, psql reports a failed statement and carries on to the next one,
 * then exits 0 — a seed that half-applied and called itself successful. It
 * belongs in the shared argument builder rather than at one call site, because
 * that is how the two client paths came to disagree about it in the first place.
 */
const ON_ERROR_STOP_ARGS = ['-v', 'ON_ERROR_STOP=1'];

/**
 * `-e PGPASSWORD` (no `=value`) forwards this process's value **into the
 * container**, where the psql that needs it actually runs; the spawn `env`
 * alone only reaches the docker client. The bare form is deliberate — writing
 * `-e PGPASSWORD=<value>` would put the password in the command line, where
 * `ps` shows it to every user on the machine.
 */
const dockerExecArgs = (settings) => [
  'exec',
  '-e',
  'PGPASSWORD',
  '-i',
  settings.dockerContainer,
];

/** Host `psql` reaches the server over TCP; the fallback runs inside the container. */
const clientArgs = ({ database, settings }) =>
  psqlBinary
    ? [
        '-h',
        settings.host,
        '-p',
        settings.port,
        '-U',
        settings.user,
        '-d',
        database,
        ...ON_ERROR_STOP_ARGS,
      ]
    : [
        ...dockerExecArgs(settings),
        'psql',
        '-U',
        settings.user,
        '-d',
        database,
        ...ON_ERROR_STOP_ARGS,
      ];

const runSqlFile = ({ env, settings, sqlFilePath }) => {
  const args = clientArgs({ database: settings.database, settings });
  const result = psqlBinary
    ? spawnSync(psqlBinary, [...args, '-f', sqlFilePath], {
        env,
        stdio: 'inherit',
      })
    : spawnSync(dockerBinary, args, {
        env,
        input: readFileSync(sqlFilePath, 'utf8'),
        stdio: ['pipe', 'inherit', 'inherit'],
      });

  assertSpawned({ command: 'psql', result });
};

const createDatabase = ({ env, settings }) => {
  const createResult = psqlBinary
    ? spawnSync(
        join(dirname(psqlBinary), 'createdb'),
        [
          '-h',
          settings.host,
          '-p',
          settings.port,
          '-U',
          settings.user,
          settings.database,
        ],
        { env, stdio: 'inherit' },
      )
    : spawnSync(
        dockerBinary,
        [
          ...dockerExecArgs(settings),
          'createdb',
          '-U',
          settings.user,
          settings.database,
        ],
        { env, stdio: 'inherit' },
      );

  assertSpawned({ command: 'createdb', result: createResult });

  console.log(`   created database: ${settings.database}`);
};

const ensureDatabaseExists = ({ env, settings }) => {
  assertSafeDatabaseName(settings.database);

  const checkResult = spawnSync(
    psqlBinary ?? dockerBinary,
    [
      ...clientArgs({ database: 'postgres', settings }),
      '-tAc',
      `SELECT 1 FROM pg_database WHERE datname = '${settings.database}'`,
    ],
    { env, stdio: ['inherit', 'pipe', 'inherit'] },
  );

  assertSpawned({ command: 'psql', result: checkResult });

  if (checkResult.stdout.toString().trim() === '1') {
    return;
  }

  createDatabase({ env, settings });
};

const main = () => {
  const missing = missingEnvKeys(process.env);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. Provide them in the shared local env file or this workspace's .env.`,
    );
  }

  const settings = readSettings(process.env);
  const env = { PATH: SAFE_PATH, PGPASSWORD: process.env.DB_PASSWORD };

  const mode = psqlBinary
    ? 'host-psql'
    : `docker-exec(${settings.dockerContainer})`;

  console.log('Seeding the car-sales database...');
  console.log(
    `   host=${settings.host} port=${settings.port} db=${settings.database} user=${settings.user}`,
  );
  console.log(`   mode=${mode}`);

  ensureDatabaseExists({ env, settings });

  for (const filename of SQL_FILENAMES) {
    runSqlFile({
      env,
      settings,
      sqlFilePath: join(WORKSPACE_ROOT, 'db', filename),
    });
  }

  console.log('Seeding finished successfully');
};

try {
  main();
} catch (error) {
  console.error(
    'Seeding failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
