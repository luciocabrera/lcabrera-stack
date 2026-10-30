import { describe, expect, it } from 'vite-plus/test';

import { COULD_NOT_RUN, runGate } from './fallow-gate-command.mjs';

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
    const tracked =
      'diff --git a/scripts/b.mjs b/scripts/b.mjs\n--- a/scripts/b.mjs\n+++ b/scripts/b.mjs\n@@ -1 +1 @@';
    const { log, status } = mutationRun({
      diff: tracked,
      statuses: [0, 1],
      stdinFiles: ['packages/ui/src/a.ts', 'scripts/b.mjs', 'scripts/new.mjs'],
    });
    expect(status).toBe(1);
    expect(log.git).toEqual([
      [
        'diff',
        '-U0',
        '--no-color',
        '--find-renames',
        'abc',
        '--',
        'scripts/b.mjs',
        'scripts/new.mjs',
      ],
    ]);
    expect(log.temp).toEqual([
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
});
