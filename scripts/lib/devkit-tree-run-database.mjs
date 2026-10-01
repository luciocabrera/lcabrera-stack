/**
 * The database lane both created-tree gates run over a `full`-rung tree: point
 * the tree's compose environment file at a Postgres, seed it through the
 * tree's own task, run the tree's smoke tests, and, for a gate that serves the
 * app, hold the rendered orders page to what SQL gives.
 *
 * The Postgres is the one `DEVKIT_TREE_DB_HOST` and its siblings name when set
 * — a CI service — and otherwise the tree's own `db:up`, on a free port and a
 * project name of its own, removed with its volume afterwards. Every tree
 * command runs with no `DB_*` variable inherited, so the tree reads its own
 * file and a developer's shell cannot stand in for it.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import process from 'node:process';
import { parseEnv } from 'node:util';

import { waitForDatabase } from '../../packages/devkit/scripts/create-readiness.mjs';
import {
  ORDERS_PROBES,
  ORDERS_QUERIES,
  orderProbeFindings,
  renderedOrderIds,
  withSettings,
} from './devkit-workspace-orders.mjs';
import { commandLabel, taskFindings } from './devkit-workspace.mjs';
import { execute } from './devkit-tree-run.mjs';

const ENVIRONMENT_FILE = 'docker/local/.env';

const COMPOSE_FILE = 'docker/local/docker-compose.yml';

const APP_DIRECTORY = 'apps/web';

const TREE_DATABASE = 'made_tree';

const READINESS_DEADLINE_MS = 90_000;

const PAGE_TIMEOUT_MS = 30_000;

const EXTERNAL = {
  DB_HOST: 'DEVKIT_TREE_DB_HOST',
  DB_PASSWORD: 'DEVKIT_TREE_DB_PASSWORD',
  DB_PORT: 'DEVKIT_TREE_DB_PORT',
  DB_USER: 'DEVKIT_TREE_DB_USER',
};

const SEED_ARGS = ['run', '--filter', 'web', 'seed'];

const SMOKE_ARGS = ['run', '--filter', 'web', 'test:smoke'];

const DATABASE_UP_ARGS = ['run', 'db:up'];

/**
 * @returns {Promise<number>}
 */
export const freePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {NodeJS.ProcessEnv}
 */
export const scrubbedEnv = (env) =>
  Object.fromEntries(
    Object.entries(env).filter(
      ([name]) => !name.startsWith('DB_') && name !== 'COMPOSE_PROJECT_NAME',
    ),
  );

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {Record<string, string> | undefined}
 */
export const externalDatabase = (env) =>
  (env[EXTERNAL.DB_HOST] ?? '') === ''
    ? undefined
    : Object.fromEntries(
        Object.entries(EXTERNAL).map(([setting, name]) => [
          setting,
          env[name] ?? '',
        ]),
      );

const settingsFor = async (env) => {
  const external = externalDatabase(env);
  if (external !== undefined) {
    return {
      external: true,
      settings: { ...external, DB_NAME: TREE_DATABASE },
    };
  }
  return {
    external: false,
    settings: {
      COMPOSE_PROJECT_NAME: `devkit-tree-gate-${process.pid}`,
      DB_HOST: '127.0.0.1',
      DB_NAME: TREE_DATABASE,
      DB_PORT: String(await freePort()),
    },
  };
};

const writeSettings = ({ settings, tree }) => {
  const path = join(tree, ENVIRONMENT_FILE);
  writeFileSync(
    path,
    withSettings({ file: readFileSync(path, 'utf8'), settings }),
  );
};

const treeStep = ({ args, command = 'vp', cwd, label, env }) =>
  taskFindings({
    label: label ?? commandLabel(args),
    ...execute({ args, command, cwd, env }),
  });

const READINESS_POLL_MS = 500;

const readinessFindings = async ({ settings }) => {
  const { last, ready } = await waitForDatabase({
    deadlineMs: READINESS_DEADLINE_MS,
    host: settings.DB_HOST,
    pollMs: READINESS_POLL_MS,
    port: Number(settings.DB_PORT),
    user: settings.DB_USER ?? 'postgres',
  });
  return ready
    ? []
    : [
        `no Postgres answered on ${settings.DB_HOST}:${settings.DB_PORT} within ${READINESS_DEADLINE_MS} ms — the last attempt saw \`${last}\``,
      ];
};

const removeComposeDatabase = ({ env, tree }) =>
  execute({
    args: [
      'compose',
      '-f',
      COMPOSE_FILE,
      '--env-file',
      ENVIRONMENT_FILE,
      'down',
      '--volumes',
    ],
    command: 'docker',
    cwd: tree,
    env,
  });

const stepsInOrder = (steps) =>
  steps.reduce(async (earlier, step) => {
    const found = await earlier;
    return found.length > 0 ? found : step();
  }, Promise.resolve([]));

/**
 * @param {{ env?: NodeJS.ProcessEnv }} [args]
 * @returns {{ prepared: (context: { tree: string }) => Promise<string[]>,
 *             teardown: () => void }}
 */
export const databaseLane = ({ env = process.env } = {}) => {
  const treeEnv = scrubbedEnv(env);
  const started = [];
  const prepared = async ({ tree }) => {
    const { external, settings } = await settingsFor(env);
    writeSettings({ settings, tree });
    const fileSettings = parseEnv(
      readFileSync(join(tree, ENVIRONMENT_FILE), 'utf8'),
    );
    if (!external) started.push(tree);
    return stepsInOrder([
      () =>
        external
          ? []
          : treeStep({ args: DATABASE_UP_ARGS, cwd: tree, env: treeEnv }),
      () => readinessFindings({ settings: fileSettings }),
      () => treeStep({ args: SEED_ARGS, cwd: tree, env: treeEnv }),
      () => treeStep({ args: SMOKE_ARGS, cwd: tree, env: treeEnv }),
    ]);
  };
  const teardown = () => {
    for (const tree of started) removeComposeDatabase({ env: treeEnv, tree });
  };
  return { prepared, teardown };
};

const QUERY_SCRIPT = [
  "import pg from 'pg';",
  'const { env } = process;',
  'const client = new pg.Client({ database: env.DB_NAME, host: env.DB_HOST, password: env.DB_PASSWORD, port: Number(env.DB_PORT), user: env.DB_USER });',
  'await client.connect();',
  'const answers = {};',
  'for (const [key, sql] of Object.entries(JSON.parse(env.ORDERS_QUERIES))) answers[key] = (await client.query(sql)).rows.map((row) => row.order_id);',
  'await client.end();',
  'process.stdout.write(JSON.stringify(answers));',
].join('\n');

/**
 * @param {{ env?: NodeJS.ProcessEnv, tree: string }} args
 * @returns {{ answers?: Record<string, number[]>, findings: string[] }}
 */
export const queriedOrders = ({ env = process.env, tree }) => {
  const result = execute({
    args: [
      `--env-file=../../${ENVIRONMENT_FILE}`,
      '--input-type=module',
      '-e',
      QUERY_SCRIPT,
    ],
    command: process.execPath,
    cwd: join(tree, APP_DIRECTORY),
    env: {
      ...scrubbedEnv(env),
      ORDERS_QUERIES: JSON.stringify(ORDERS_QUERIES),
    },
  });
  const findings = taskFindings({
    label: 'the SQL the orders checks compare against',
    ...result,
  });
  return findings.length > 0
    ? { findings }
    : { answers: JSON.parse(result.output), findings };
};

const pageOf = async (url) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
    return { html: await response.text(), status: response.status };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * @param {{ answers: Record<string, number[]>, baseUrl: string }} args
 * @returns {Promise<string[]>}
 */
export const orderedRowFindings = async ({ answers, baseUrl }) => {
  const checked = await Promise.all(
    ORDERS_PROBES.map(async ({ key, search, verb }) => {
      const url = `${baseUrl}${search}`;
      const page = await pageOf(url);
      if (page.status !== 200) {
        return [
          `\`GET ${url}\` ${page.status === undefined ? `never answered (${page.error})` : `answered HTTP ${page.status}`}, so nothing shows whether the route did ${verb}`,
        ];
      }
      return orderProbeFindings({
        baseline: answers.baseline ?? [],
        expected: answers[key] ?? [],
        key,
        rendered: renderedOrderIds(page.html),
        url,
        verb,
      });
    }),
  );
  return checked.flat();
};
