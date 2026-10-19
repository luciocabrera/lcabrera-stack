/*
 * Finding and running a host tool this package may only use when present: the
 * code host's CLI and the container engine.
 *
 * The executable is resolved from the fixed install locations first and then
 * from PATH, and always spawned by absolute path with PATH pinned for the
 * child, under the same discipline `git-exec.mjs` applies to git. Unlike git, a
 * missing tool is an answer rather than an error: the caller reports what it
 * could not learn and keeps everything that answer would have decided.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';

const IS_ON_WINDOWS = process.platform === 'win32';

const TRUSTED_TOOL_DIRECTORIES = IS_ON_WINDOWS
  ? []
  : ['/usr/local/bin', '/usr/bin', '/bin', '/opt/homebrew/bin'];

export const pathDirectories = (env = process.env) =>
  (env.PATH ?? '').split(delimiter).filter((entry) => entry !== '');

const filenamesFor = (name) =>
  IS_ON_WINDOWS ? [`${name}.exe`, `${name}.cmd`, name] : [name];

const firstUnder = ({ directories, exists, filenames }) =>
  directories
    .flatMap((directory) => filenames.map((file) => join(directory, file)))
    .find((path) => exists(path));

/**
 * @param {{ directories: string[], exists?: (path: string) => boolean,
 *   filenames: string[], pathEntries: string[] }} args
 * @returns {string | undefined}
 */
export const resolveExecutable = ({
  directories,
  exists = existsSync,
  filenames,
  pathEntries,
}) =>
  firstUnder({ directories, exists, filenames }) ??
  firstUnder({ directories: pathEntries, exists, filenames });

/**
 * @param {{ directories?: string[], name: string, pathEntries?: string[] }} args
 * @returns {string | undefined}
 */
export const resolveTool = ({
  directories = TRUSTED_TOOL_DIRECTORIES,
  name,
  pathEntries = pathDirectories(),
}) =>
  resolveExecutable({
    directories,
    filenames: filenamesFor(name),
    pathEntries,
  });

const firstLine = (text = '') =>
  String(text)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line !== '');

const failureReason = (error) =>
  firstLine(error?.stderr) ??
  (error instanceof Error ? error.message : String(error));

/**
 * @param {{ args: string[], binary: string, cwd: string, timeout?: number }} args
 * @returns {{ ok: true, stdout: string } | { ok: false, reason: string }}
 */
export const runTool = ({ args, binary, cwd, timeout = 60_000 }) => {
  try {
    const stdout = execFileSync(binary, args, {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: [dirname(binary), ...TRUSTED_TOOL_DIRECTORIES].join(delimiter),
      },
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
    });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, reason: failureReason(error) };
  }
};
