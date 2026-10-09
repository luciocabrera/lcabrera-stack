import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { relativeImports } from './run-envelope.mjs';

const EVALS_DIR = dirname(fileURLToPath(import.meta.url));

const RAW_WRITE =
  /\b(?:writeFileSync|writeFile|writeSync|appendFileSync|appendFile|createWriteStream|copyFileSync|copyFile|cpSync|cp|renameSync|rename|linkSync|symlinkSync|truncateSync)\b(?=\s*[(,}])|node:fs\/promises/g;

const ALLOWED = {
  'skills/verify-skill-triggers.mjs': ['cpSync', 'renameSync', 'symlinkSync'],
  'transcript-scrub.mjs': ['writeFileSync'],
  'verifier-fixtures/tooled-worktree.mjs': ['writeFileSync'],
};

const posix = (path) => path.replaceAll('\\', '/');

const runners = readdirSync(EVALS_DIR, { recursive: true })
  .map(posix)
  .filter((path) => !path.startsWith('node_modules/'))
  .filter((path) => /^verify-.*\.mjs$/.test(basename(path)));

const importsOf = (path) =>
  relativeImports(readFileSync(join(EVALS_DIR, path), 'utf8'))
    .map((specifier) =>
      posix(relative(EVALS_DIR, resolve(EVALS_DIR, dirname(path), specifier))),
    )
    .filter((target) => !target.startsWith('..'));

const closure = (pending, seen = new Set()) => {
  const [path, ...rest] = pending;
  if (path === undefined) {
    return [...seen].toSorted((left, right) => left.localeCompare(right));
  }
  return seen.has(path)
    ? closure(rest, seen)
    : closure([...rest, ...importsOf(path)], new Set([...seen, path]));
};

const writers = closure([...runners, 'run-record.mjs']);

const rawWrites = (path) =>
  [
    ...new Set(
      readFileSync(join(EVALS_DIR, path), 'utf8').match(RAW_WRITE) ?? [],
    ),
  ].filter((call) => !(ALLOWED[path] ?? []).includes(call));

describe('runner output', () => {
  it('reads every runner and the evals modules they import', () => {
    expect(writers).toStrictEqual(
      expect.arrayContaining([
        'agent-sessions.mjs',
        'run-record.mjs',
        'skill-quality/verify-skill-quality.mjs',
        'skills/trigger-matrix.mjs',
        'skills/verify-skill-triggers.mjs',
        'transcript-scrub.mjs',
        'verifier-fixtures/tooled-worktree.mjs',
        'verifier-fixtures/verify-verifier-tooled.mjs',
        'verifier-fixtures/verify-verifier-verdicts.mjs',
      ]),
    );
  });

  it.each(writers)(
    '%s writes files only through writeScrubbed, or into a scratch directory it owns',
    (path) => {
      expect(rawWrites(path)).toStrictEqual([]);
    },
  );
});
