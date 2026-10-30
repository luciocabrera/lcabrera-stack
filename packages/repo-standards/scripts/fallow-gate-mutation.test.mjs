import { describe, expect, it } from 'vite-plus/test';

import { runGate } from './fallow-gate-command.mjs';
import { gitDiffArgs } from './fallow-gate-diff.mjs';
import { COULD_NOT_RUN } from './fallow-gate.mjs';

const mutationRun = ({ diff = '', statuses = [], stdinFiles }) => {
  const log = { git: [], runs: [], temp: [], written: '' };
  const pending = [...statuses];
  const effects = {
    exists: () => true,
    git: (args) => {
      log.git.push(args);
      return { status: 0, stdout: diff };
    },
    readFile: (path) => `export const fromFile = '${path}';\n`,
    readStdinFiles: () => stdinFiles,
    root: '/repo',
    spawn: (args) => {
      log.runs.push(args);
      return { status: pending.length > 0 ? pending.shift() : 0 };
    },
    withTempFile: (content, use) => {
      log.temp.push(content);
      return use('/tmp/gate/changes.diff');
    },
    workspaceDirs: () => ['packages/ui'],
    write: (text) => {
      log.written += text;
    },
    writeError: (text) => {
      log.written += text;
    },
  };
  return {
    log,
    status: runGate({ argv: ['mutation'], base: 'abc', effects }),
  };
};

const tracked =
  'diff --git a/scripts/b.mjs b/scripts/b.mjs\n--- a/scripts/b.mjs\n+++ b/scripts/b.mjs\n@@ -1 +1 @@';
const component =
  'diff --git a/packages/ui/src/a.ts b/packages/ui/src/a.ts\n--- a/packages/ui/src/a.ts\n+++ b/packages/ui/src/a.ts\n@@ -2 +2 @@';
const styles =
  'diff --git a/packages/ui/src/a.stylex.ts b/packages/ui/src/a.stylex.ts\n--- a/packages/ui/src/a.stylex.ts\n+++ b/packages/ui/src/a.stylex.ts\n@@ -4 +4 @@';

describe('runGate — mutation', () => {
  it('runs each workspace root once and returns the worst status', () => {
    const { log, status } = mutationRun({
      statuses: [1],
      stdinFiles: ['packages/ui/src/a.ts'],
    });
    expect(status).toBe(1);
    expect(log.runs.map((args) => args[2])).toEqual(['packages/ui']);
    expect(log.written).toBe('\nfallow mutation: packages/ui\n');
  });

  it('passes when every root passes', () => {
    expect(mutationRun({ stdinFiles: ['packages/ui/src/a.ts'] }).status).toBe(
      0,
    );
  });

  it('treats a root whose run was killed as unable to run', () => {
    expect(
      mutationRun({ statuses: [null], stdinFiles: ['packages/ui/src/a.ts'] })
        .status,
    ).toBe(COULD_NOT_RUN);
  });

  it('mutates files outside every workspace from the repository root, scoped to their diff', () => {
    const { log, status } = mutationRun({
      diff: `${tracked}\n${component}\n`,
      statuses: [0, 1],
      stdinFiles: ['packages/ui/src/a.ts', 'scripts/b.mjs', 'scripts/new.mjs'],
    });
    expect(status).toBe(1);
    expect(log.git).toEqual([gitDiffArgs('abc')]);
    expect(log.temp).toEqual([
      `${component}\n`,
      `${tracked}\ndiff --git a/scripts/new.mjs b/scripts/new.mjs\nnew file mode 100644\n--- /dev/null\n+++ b/scripts/new.mjs\n@@ -0,0 +1,1 @@\n+export const fromFile = 'scripts/new.mjs';\n`,
    ]);
    expect(log.runs[1]).toEqual([
      'mutation',
      '--root',
      '.',
      '--changed-since',
      'abc',
      '--diff-file',
      '/tmp/gate/changes.diff',
      '--min-score',
      '100',
      '--allow-dirty',
      '--quiet',
    ]);
    expect(log.written).toBe(
      '\nfallow mutation: packages/ui\n' +
        '\nfallow mutation: 2 changed file(s) outside every workspace, from the repository root: scripts/b.mjs, scripts/new.mjs\n' +
        '\nfallow mutation: .\n',
    );
  });

  it('hands a workspace root a diff file of its own files, an untracked one included', () => {
    const { log } = mutationRun({
      diff: `${component}\n${tracked}\n`,
      stdinFiles: ['packages/ui/src/a.ts', 'packages/ui/src/fresh.ts'],
    });
    expect(log.temp).toEqual([
      `${component}\ndiff --git a/packages/ui/src/fresh.ts b/packages/ui/src/fresh.ts\nnew file mode 100644\n--- /dev/null\n+++ b/packages/ui/src/fresh.ts\n@@ -0,0 +1,1 @@\n+export const fromFile = 'packages/ui/src/fresh.ts';\n`,
    ]);
    expect(log.runs[0]).toContain('--diff-file');
  });

  it.each([
    [[1, 2], '.'],
    [[2, 1], 'packages/ui'],
  ])(
    'lets a finding win over a root that could not run (statuses %j, failing root %s)',
    (statuses, failing) => {
      const { log, status } = mutationRun({
        statuses,
        stdinFiles: ['packages/ui/src/a.ts', 'scripts/b.mjs'],
      });
      expect(status).toBe(1);
      expect(log.written).toContain(
        `repo-fallow-gate: fallow mutation could not run in ${failing}.\n`,
      );
    },
  );

  it('reports could-not-run when no root found a survivor', () => {
    const { log, status } = mutationRun({
      statuses: [0, 2],
      stdinFiles: ['packages/ui/src/a.ts', 'scripts/b.mjs'],
    });
    expect(status).toBe(COULD_NOT_RUN);
    expect(log.written).toContain('could not run in .');
  });
});

describe('runGate — mutation next to a style module', () => {
  it('drops the style module from the diff file and names it as not mutated', () => {
    const { log, status } = mutationRun({
      diff: `${styles}\n${component}\n`,
      stdinFiles: ['packages/ui/src/a.stylex.ts', 'packages/ui/src/a.ts'],
    });
    expect(status).toBe(0);
    expect(log.temp).toEqual([`${component}\n`]);
    expect(log.runs).toHaveLength(1);
    expect(log.written).toBe(
      'fallow mutation: not mutated (style module): packages/ui/src/a.stylex.ts\n' +
        '\nfallow mutation: packages/ui\n',
    );
  });

  it('still fails on a mutant that survives in the component beside it', () => {
    const { status } = mutationRun({
      diff: `${styles}\n${component}\n`,
      statuses: [1],
      stdinFiles: ['packages/ui/src/a.stylex.ts', 'packages/ui/src/a.ts'],
    });
    expect(status).toBe(1);
  });

  it('leaves a style module outside every workspace out of the repository-root run', () => {
    const { log } = mutationRun({
      diff: `${tracked}\n`,
      stdinFiles: ['scripts/b.mjs', 'theme.stylex.ts'],
    });
    expect(log.temp).toEqual([`${tracked}\n`]);
    expect(log.written).toContain(
      'fallow mutation: not mutated (style module): theme.stylex.ts\n',
    );
    expect(log.written).toContain(
      'outside every workspace, from the repository root: scripts/b.mjs\n',
    );
  });

  it('runs nothing when every changed source file is a style module', () => {
    const { log, status } = mutationRun({
      diff: `${styles}\n`,
      stdinFiles: ['packages/ui/src/a.stylex.ts'],
    });
    expect(status).toBe(0);
    expect(log.runs).toEqual([]);
    expect(log.git).toEqual([]);
    expect(log.written).toBe(
      'fallow mutation: not mutated (style module): packages/ui/src/a.stylex.ts\n' +
        'fallow mutation: no changed source file besides style modules, so there is nothing to mutate.\n',
    );
  });
});
