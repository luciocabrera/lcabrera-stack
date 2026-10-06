/*
 * The steps `devkit create` takes after its commit: the install, then the
 * tree's own database tasks with a readiness wait between them. The decisions
 * are in `create-setup.mjs`; this file looks things up on PATH and runs them.
 */

import { spawnSync } from 'node:child_process';
import {
  accessSync,
  constants,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { delimiter, join } from 'node:path';
import process from 'node:process';

import {
  composeProjectNameFor,
  DATABASE_UP_TASK,
  databaseSkippedNotice,
  databaseTarget,
  DOCKER_MISSING,
  DOCKER_STOPPED,
  ENVIRONMENT_FILE,
  ENVIRONMENT_TEMPLATE,
  environmentFromTemplate,
  installerFor,
  noInstallerNotice,
  READINESS_DEADLINE_MS,
  runPrefixFor,
  SEED_TASK,
  setupStepFailure,
  withoutDatabaseSettings,
} from './create-setup.mjs';
import { firstInstallFor } from './create.mjs';

const IS_ON_WINDOWS = process.platform === 'win32';

const READINESS_MODULE = new URL('create-readiness.mjs', import.meta.url).href;

const WAIT_PROGRAM = [
  'const [moduleUrl, host, port, user, deadline] = process.argv.slice(1);',
  'const { waitForDatabase } = await import(moduleUrl);',
  'const { last, ready } = await waitForDatabase({ deadlineMs: Number(deadline), host, pollMs: 500, port: Number(port), user });',
  "if (!ready) console.error('create: no Postgres answered on ' + host + ':' + port + ' within ' + deadline + ' ms; the last attempt saw ' + last + '.');",
  'process.exitCode = ready ? 0 : 1;',
].join('\n');

const DOCKER_PROBE_TIMEOUT_MS = 30_000;

const extensionsFor = () =>
  IS_ON_WINDOWS
    ? ['', ...(process.env.PATHEXT ?? '.EXE;.CMD').split(';')]
    : [''];

const isExecutableFile = (path) => {
  try {
    accessSync(path, constants.X_OK);
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

/**
 * @param {string} name
 * @returns {string | undefined}
 */
const findOnPath = (name) =>
  (process.env.PATH ?? '')
    .split(delimiter)
    .filter((entry) => entry !== '')
    .flatMap((directory) =>
      extensionsFor().map((extension) =>
        join(directory, `${name}${extension}`),
      ),
    )
    .find((path) => isExecutableFile(path));

const succeeded = ({ args, binary, cwd, env, stdio = 'inherit' }) => {
  const result = spawnSync(IS_ON_WINDOWS ? `"${binary}"` : binary, args, {
    cwd,
    env,
    shell: IS_ON_WINDOWS,
    stdio,
    timeout: stdio === 'ignore' ? DOCKER_PROBE_TIMEOUT_MS : undefined,
  });
  return result.error === undefined && result.status === 0;
};

/**
 * @param {{ absolute: string, packageName: string }} args
 * @returns {boolean} whether the template was copied
 */
export const copyEnvironmentTemplate = ({ absolute, packageName }) => {
  const template = join(absolute, ENVIRONMENT_TEMPLATE);
  const file = join(absolute, ENVIRONMENT_FILE);
  if (!existsSync(template) || existsSync(file)) return false;
  writeFileSync(
    file,
    environmentFromTemplate({
      projectName: composeProjectNameFor(packageName),
      template: readFileSync(template, 'utf8'),
    }),
  );
  return true;
};

const announced = ({ args, binary, cwd, env, label }) => {
  console.log(`\nRunning \`${label}\``);
  return succeeded({ args, binary, cwd, env });
};

const treeEnv = () => withoutDatabaseSettings(process.env);

const waitedForDatabase = (absolute) => {
  const file = join(absolute, ENVIRONMENT_FILE);
  const { host, port, user } = databaseTarget({
    file: existsSync(file) ? readFileSync(file, 'utf8') : '',
  });
  console.log('\nWaiting for Postgres to answer');
  return succeeded({
    args: [
      '--input-type=module',
      '--eval',
      WAIT_PROGRAM,
      READINESS_MODULE,
      host,
      port,
      user,
      String(READINESS_DEADLINE_MS),
    ],
    binary: process.execPath,
    cwd: absolute,
  });
};

const failedAt = ({ command, state, target }) => ({
  ...state,
  code: 1,
  failure: setupStepFailure({ command, target }),
});

const databaseUnavailable = () => {
  const docker = findOnPath('docker');
  if (docker === undefined) return DOCKER_MISSING;
  return succeeded({ args: ['info'], binary: docker, stdio: 'ignore' })
    ? undefined
    : DOCKER_STOPPED;
};

const seededDatabase = ({ absolute, binary, run, state, target }) => {
  const seed = `${run} ${SEED_TASK}`;
  const reason = databaseUnavailable();
  if (reason !== undefined) {
    return {
      ...state,
      notes: [databaseSkippedNotice({ reason, seed })],
    };
  }
  const up = `${run} ${DATABASE_UP_TASK}`;
  const steps = [
    {
      command: up,
      ran: () =>
        announced({
          args: ['run', DATABASE_UP_TASK],
          binary,
          cwd: absolute,
          env: treeEnv(),
          label: up,
        }),
    },
    { command: 'the readiness wait', ran: () => waitedForDatabase(absolute) },
    {
      command: seed,
      ran: () =>
        announced({
          args: ['run', SEED_TASK],
          binary,
          cwd: absolute,
          env: treeEnv(),
          label: seed,
        }),
    },
  ];
  const failed = steps.find((step) => !step.ran());
  return failed === undefined
    ? { ...state, seeded: true }
    : failedAt({ command: failed.command, state, target });
};

const withoutInstaller = ({ configuredRun, idle }) =>
  configuredRun === undefined
    ? idle
    : {
        ...idle,
        notes: [noInstallerNotice({ install: firstInstallFor(configuredRun) })],
      };

const installedWith = ({ absolute, installer, state, target }) => {
  const install = `${installer} install`;
  const ran = announced({
    args: ['install'],
    binary: findOnPath(installer),
    cwd: absolute,
    label: install,
  });
  return ran
    ? { ...state, installed: true }
    : failedAt({ command: install, state, target });
};

/**
 * @param {{ absolute: string, configuredRun?: string,
 *           flags: { database: boolean, install: boolean },
 *           hasDatabase: boolean, target: string }} args
 * @returns {{ code: number, failure?: string, installed: boolean,
 *             notes: string[], run?: string, seeded: boolean }}
 */
export const runSetup = ({
  absolute,
  configuredRun,
  flags,
  hasDatabase,
  target,
}) => {
  const idle = {
    code: 0,
    installed: false,
    notes: [],
    run: configuredRun,
    seeded: false,
  };
  if (!flags.install) return idle;
  const installer = installerFor({
    isOnPath: (name) => findOnPath(name) !== undefined,
    userAgent: process.env.npm_config_user_agent,
  });
  if (installer === undefined) return withoutInstaller({ configuredRun, idle });
  const run = runPrefixFor(installer);
  const installed = installedWith({
    absolute,
    installer,
    state: { ...idle, run },
    target,
  });
  return hasDatabase && flags.database && installed.installed
    ? seededDatabase({
        absolute,
        binary: findOnPath(installer),
        run,
        state: installed,
        target,
      })
    : installed;
};
