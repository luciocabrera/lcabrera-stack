/**
 * A bin that takes its input on stdin is invoked with something feeding it.
 * The bins moved out of `scripts/` in #1072 kept that feed in the root
 * manifest, except the coverage pair, whose feed lived in the CI step instead:
 * rewriting the step to `vp run coverage:merge -- --changed` left `--changed`
 * reading an empty stdin, so the gate wrote an empty coverage file and passed.
 * An unfed stdin fails open by construction — the runner sees "nothing
 * changed" — so the wiring is what has to be asserted.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const read = (path) => readFileSync(join(REPO_ROOT, path), 'utf8');

const GATES_DIR = 'packages/repo-standards';

const READS_STDIN = /readFileSync\(0\b|\breadStdin\(|\breadChangedFiles\(/u;

const CONDITIONAL_READERS = new Map([
  [
    'repo-verify-commit',
    'takes a message file path; it reads stdin only when handed `-`',
  ],
]);

const FEEDER = 'scripts/changed-files.sh';

const stdinBins = () => {
  const bins = JSON.parse(read(`${GATES_DIR}/package.json`)).bin ?? {};
  return Object.entries(bins)
    .filter(([name]) => !CONDITIONAL_READERS.has(name))
    .filter(([, relative]) => READS_STDIN.test(read(join(GATES_DIR, relative))))
    .map(([name]) => name);
};

const rootScripts = () => JSON.parse(read('package.json')).scripts;

const invocationsOf = (bin) =>
  Object.entries(rootScripts()).filter(([, command]) =>
    new RegExp(`(^|[\\s|])${bin}(\\s|$)`, 'u').test(command),
  );

const isFed = (command, bin) =>
  command.includes(FEEDER) ||
  new RegExp(`\\|\\s*${bin}(\\s|$)`, 'u').test(command);

const workflowBodies = () =>
  readdirSync(join(REPO_ROOT, '.github/workflows'))
    .filter((file) => file.endsWith('.yml'))
    .map((file) => [file, read(`.github/workflows/${file}`)]);

describe('bins that read stdin', () => {
  it('is a non-empty set, or this file asserts nothing', () => {
    expect(stdinBins().length).toBeGreaterThan(0);
  });

  it('is fed by every root manifest line that invokes one', () => {
    const unfed = stdinBins().flatMap((bin) =>
      invocationsOf(bin)
        .filter(([, command]) => !isFed(command, bin))
        .map(([task]) => `${task} → ${bin}`),
    );
    expect(unfed).toEqual([]);
  });
});

describe('the coverage pair', () => {
  it('carries the changed-file feeder in the root manifest', () => {
    const scripts = rootScripts();
    expect(scripts['coverage:merge']).toContain(FEEDER);
    expect(scripts['coverage:report']).toContain(FEEDER);
  });

  it('feeds only the changed mode, so the full run needs no merge base', () => {
    const scripts = rootScripts();
    for (const task of ['coverage:merge', 'coverage:report']) {
      expect(scripts[task]).toContain('--if-arg --changed');
    }
  });

  it('is invoked through those tasks in CI, never as a bare bin', () => {
    const direct = workflowBodies().flatMap(([file, body]) =>
      ['repo-merge-coverage', 'repo-coverage-report']
        .filter((bin) => body.includes(bin))
        .map((bin) => `${file} → ${bin}`),
    );
    expect(direct).toEqual([]);
  });
});
