/**
 * The throwaway containers `housekeeping:prune` may remove: those carrying the
 * label whose value names the worktree that started them. Docker is spawned by
 * absolute path from the fixed install directories, with PATH pinned for the
 * child, under the discipline `gh-exec.mjs` applies to gh. A machine without
 * Docker, or with its daemon down, answers with a reason instead of a list.
 * REPO_STANDARDS_NO_DOCKER, set to any non-empty value, keeps a run off Docker
 * entirely; REPO_STANDARDS_DOCKER names the executable by absolute path.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';

import { THROWAWAY_LABEL } from './housekeeping-plan.mjs';

const TRUSTED_DIRECTORIES = ['/usr/local/bin', '/usr/bin', '/bin'];

/**
 * @param {string[]} [directories]
 * @returns {string | undefined}
 */
export const dockerBinary = (directories = TRUSTED_DIRECTORIES) =>
  directories
    .map((directory) => `${directory}/docker`)
    .find((path) => existsSync(path));

const parseJson = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

const CONTAINER_FORMAT = `{"id":{{json .ID}},"name":{{json .Names}},"state":{{json .State}},"label":{{json (.Label "${THROWAWAY_LABEL}")}}}`;

const unreadable = (line) => ({
  id: '',
  isLabelRead: false,
  name: line,
  running: false,
  worktree: '',
});

const containerFrom = (line) => {
  const entry = parseJson(line);
  if (entry === null || typeof entry !== 'object') return unreadable(line);
  const { id, label, name, state } = entry;
  if (typeof label !== 'string' || typeof id !== 'string' || id === '') {
    return unreadable(line);
  }
  return {
    id,
    isLabelRead: true,
    name: typeof name === 'string' && name !== '' ? name : id,
    running: String(state).toLowerCase() === 'running',
    state: String(state).toLowerCase(),
    worktree: label,
  };
};

/**
 * @param {string} output
 */
export const parseContainers = (output) =>
  output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => containerFrom(line));

const firstLine = (text = '') =>
  String(text)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line !== '');

const runDocker = ({ args, binary }) => {
  try {
    const stdout = execFileSync(binary, args, {
      encoding: 'utf8',
      env: { ...process.env, PATH: TRUSTED_DIRECTORIES.join(':') },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60_000,
    });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, reason: firstLine(error?.stderr) ?? String(error) };
  }
};

/**
 * @param {string | undefined} binary
 * @returns {{ containers: object[], error?: string }}
 */
const listThrowawayContainers = (binary) => {
  if (binary === undefined) {
    return { containers: [], error: 'docker is not installed' };
  }
  const result = runDocker({
    args: [
      'ps',
      '-a',
      '--filter',
      `label=${THROWAWAY_LABEL}`,
      '--format',
      CONTAINER_FORMAT,
    ],
    binary,
  });
  return result.ok
    ? { containers: parseContainers(result.stdout) }
    : {
        containers: [],
        error: `docker could not list containers (${result.reason})`,
      };
};

/**
 * @param {{ binary: string | undefined, id: string }} args
 */
const removeContainer = ({ binary, id }) =>
  binary === undefined
    ? { ok: false, reason: 'docker is not installed' }
    : runDocker({ args: ['rm', '-f', id], binary });

export const NO_DOCKER_ENV = 'REPO_STANDARDS_NO_DOCKER';

export const DOCKER_ENV = 'REPO_STANDARDS_DOCKER';

const dockerOff = {
  list: () => ({
    containers: [],
    error: `container checks are off because ${NO_DOCKER_ENV} is set`,
  }),
  remove: () => ({ ok: false, reason: `${NO_DOCKER_ENV} is set` }),
};

const hostFor = (binary) => ({
  list: () => listThrowawayContainers(binary),
  remove: (id) => removeContainer({ binary, id }),
});

const namedExecutable = (path) =>
  isAbsolute(path) && existsSync(path) ? path : undefined;

/**
 * @param {string[]} [directories]
 */
export const dockerHost = (directories) => hostFor(dockerBinary(directories));

/**
 * @param {Record<string, string | undefined>} [env]
 */
export const dockerFor = (env = process.env) => {
  if ((env[NO_DOCKER_ENV] ?? '') !== '') return dockerOff;
  const named = env[DOCKER_ENV] ?? '';
  return named === '' ? dockerHost() : hostFor(namedExecutable(named));
};
