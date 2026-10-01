/*
 * What `devkit create` decides about the steps after the commit: the install,
 * then the local database. Pure, so each decision is reachable from a test
 * passing literal values; `command-create-setup.mjs` runs them.
 *
 * The database steps are the tree's own tasks rather than `docker` calls made
 * from here, so a step this run could not take is reported as the command the
 * repository will still answer later.
 */

import { parseEnv } from 'node:util';

import { runnerFromUserAgent } from './init.mjs';

const NO_INSTALL_FLAG = '--no-install';

const NO_DATABASE_FLAG = '--no-db';

const SETUP_FLAGS = new Set([NO_DATABASE_FLAG, NO_INSTALL_FLAG]);

export const ENVIRONMENT_TEMPLATE = 'docker/local/.env.example';

export const ENVIRONMENT_FILE = 'docker/local/.env';

export const SEED_TASK = 'db:seed';

export const DATABASE_UP_TASK = 'db:up';

export const READINESS_DEADLINE_MS = 90_000;

const VITE_PLUS = 'vp';

const PACKAGE_MANAGERS = new Set(['bun', 'npm', 'pnpm', 'yarn']);

const PROJECT_NAME_KEY = 'COMPOSE_PROJECT_NAME';

/**
 * @param {string[]} argv
 * @returns {{ database: boolean, install: boolean, rest: string[] }}
 */
export const readSetupFlags = (argv) => {
  const shouldInstall = !argv.includes(NO_INSTALL_FLAG);
  return {
    database: shouldInstall && !argv.includes(NO_DATABASE_FLAG),
    install: shouldInstall,
    rest: argv.filter((entry) => !SETUP_FLAGS.has(entry)),
  };
};

/**
 * @param {{ isOnPath: (name: string) => boolean, userAgent?: string }} args
 * @returns {string | undefined}
 */
export const installerFor = ({ isOnPath, userAgent }) => {
  if (isOnPath(VITE_PLUS)) return VITE_PLUS;
  const named = runnerFromUserAgent(userAgent);
  return named !== undefined && PACKAGE_MANAGERS.has(named) && isOnPath(named)
    ? named
    : undefined;
};

/**
 * @param {string} installer
 * @returns {string}
 */
export const runPrefixFor = (installer) => `${installer} run`;

/**
 * @param {{ projectName: string, template: string }} args
 * @returns {string}
 */
export const environmentFromTemplate = ({ projectName, template }) =>
  template
    .split('\n')
    .map((line) =>
      line.startsWith(`${PROJECT_NAME_KEY}=`)
        ? `${PROJECT_NAME_KEY}=${projectName}`
        : line,
    )
    .join('\n');

/**
 * @param {string} packageName
 * @returns {string}
 */
export const composeProjectNameFor = (packageName) =>
  packageName.replaceAll('.', '-');

/**
 * @param {{ file: string }} args
 * @returns {{ host: string, port: string, user: string }}
 */
export const databaseTarget = ({ file }) => {
  const settings = parseEnv(file);
  return {
    host: settings.DB_HOST ?? 'localhost',
    port: settings.DB_PORT ?? '5432',
    user: settings.DB_USER ?? 'postgres',
  };
};

/**
 * @param {Record<string, string | undefined>} env
 * @returns {Record<string, string | undefined>}
 */
export const withoutDatabaseSettings = (env) =>
  Object.fromEntries(
    Object.entries(env).filter(
      ([name]) => !name.startsWith('DB_') && name !== 'COMPOSE_PROJECT_NAME',
    ),
  );

/**
 * @param {{ reason: string, seed: string }} args
 * @returns {string}
 */
export const databaseSkippedNotice = ({ reason, seed }) =>
  `The database was not started: ${reason}. Run \`${seed}\` once it is, from inside the repository.`;

export const DOCKER_MISSING = 'there is no `docker` on this PATH';

export const DOCKER_STOPPED =
  '`docker info` failed, so Docker is installed and not running';

/**
 * @param {{ install: string }} args
 * @returns {string}
 */
export const noInstallerNotice = ({ install }) =>
  `Nothing was installed: neither \`vp\` nor the package manager that ran this is on this PATH. Run \`${install}\` from inside the repository once one is.`;

/**
 * @param {{ command: string, target: string }} args
 * @returns {string}
 */
export const setupStepFailure = ({ command, target }) =>
  `create: \`${command}\` failed. The repository is in place in \`${target}\`, committed, with every step before this one done. Fix what the output above names, then run the remaining steps below from inside it.`;
