/**
 * The throwaway containers `housekeeping:prune` may remove: those carrying the
 * label whose value names the worktree that started them. Docker is spawned by
 * absolute path from the fixed install directories, with PATH pinned for the
 * child, under the discipline `gh-exec.mjs` applies to gh. A machine without
 * Docker, or with its daemon down, answers with a reason instead of a list.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

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

const labelValue = (labels = '') =>
  String(labels)
    .split(',')
    .map((pair) => pair.split('='))
    .find(([key]) => key === THROWAWAY_LABEL)?.[1] ?? '';

/**
 * @param {string} output
 */
export const parseContainers = (output) =>
  output
    .split('\n')
    .map((line) => parseJson(line.trim()))
    .filter((entry) => entry !== null && typeof entry === 'object')
    .map((entry) => ({
      id: String(entry.ID ?? ''),
      name: String(entry.Names ?? entry.ID ?? ''),
      running: String(entry.State ?? '').toLowerCase() === 'running',
      worktree: labelValue(entry.Labels),
    }));

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
export const listThrowawayContainers = (binary) => {
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
      '{{json .}}',
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
export const removeContainer = ({ binary, id }) =>
  binary === undefined
    ? { ok: false, reason: 'docker is not installed' }
    : runDocker({ args: ['rm', '-f', id], binary });
