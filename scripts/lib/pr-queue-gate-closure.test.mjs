/**
 * S9 — the operator does not merge changes to its own leash — is only as good as
 * the list of files that leash covers, and a hand-kept list rots. These walk the
 * operator's real import graph and fail in BOTH directions: a file it imports
 * that `OPERATOR_FILES` does not name, and a name in `OPERATOR_FILES` that
 * nothing imports and the operator never opens by path either.
 *
 * Separate from `pr-queue-gate.test.mjs` because it is a different kind of test:
 * everything there is pure and decides a verdict from a fact record, and
 * everything here reads the filesystem.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { extractImportSpecifiers } from '../../packages/devkit/scripts/closure-extract.mjs';
import { detectStops, OPERATOR_FILES } from './pr-queue-gate.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const OPERATOR_ENTRY = 'scripts/pr-queue-operator.mjs';

const repoRelative = (fromFile, specifier) =>
  relative(REPO_ROOT, resolve(dirname(join(REPO_ROOT, fromFile)), specifier))
    .split('\\')
    .join('/');

const importClosure = (entry) => {
  const seen = new Set();
  const pending = [entry];
  while (pending.length > 0) {
    const current = pending.pop();
    if (seen.has(current)) continue;
    seen.add(current);
    const full = join(REPO_ROOT, current);
    if (!existsSync(full)) continue;
    for (const { specifier } of extractImportSpecifiers(
      readFileSync(full, 'utf8'),
    )) {
      if (specifier.startsWith('.'))
        pending.push(repoRelative(current, specifier));
    }
  }
  return [...seen].sort((left, right) => left.localeCompare(right));
};

const prTouching = (path) => ({
  files: [{ additions: 5, deletions: 1, path }],
  mergeable: 'MERGEABLE',
  queue: {
    ejectedAt: '',
    ejectedReason: '',
    enabled: false,
    position: undefined,
    queued: false,
    state: '',
  },
});

describe('S9 — the operator will not land a change to its own leash', () => {
  it('covers every file the operator imports', () => {
    const closure = importClosure(OPERATOR_ENTRY);
    expect(closure).toContain(OPERATOR_ENTRY);
    expect(closure.length).toBeGreaterThan(1);
    expect(closure.filter((path) => !OPERATOR_FILES.has(path))).toEqual([]);
  });

  it('lists nothing the operator does not open by name', () => {
    const entry = readFileSync(join(REPO_ROOT, OPERATOR_ENTRY), 'utf8');
    const closure = importClosure(OPERATOR_ENTRY);
    const beyondClosure = [...OPERATOR_FILES].filter(
      (path) => !closure.includes(path),
    );
    expect(beyondClosure.length).toBeGreaterThan(0);
    for (const path of beyondClosure) {
      expect(existsSync(join(REPO_ROOT, path))).toBe(true);
      expect(
        entry.includes(`'${path}'`) || entry.includes(`"${path}"`),
        `${path} is in OPERATOR_FILES but ${OPERATOR_ENTRY} never names it`,
      ).toBe(true);
    }
  });

  it.each([...OPERATOR_FILES])('stops a PR touching %s', (path) => {
    expect(detectStops(prTouching(path)).map((stop) => stop.id)).toContain(
      'S9',
    );
  });
});
