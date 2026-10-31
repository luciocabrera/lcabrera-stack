import { describe, expect, it } from 'vite-plus/test';

import { runGate } from './fallow-gate-command.mjs';
import { gitDiffArgs } from './fallow-gate-diff.mjs';
import { COULD_NOT_RUN } from './fallow-gate.mjs';

const fakeEffects = ({
  diff = { status: 0, stdout: '' },
  existing = ['a.ts', 'b.ts', 'packages/ui/src/c.ts', 'scripts/d.mjs', 'e.ts'],
  replies = [],
  stdinFiles = [],
  workspaceDirs = ['packages/ui'],
} = {}) => {
  const calls = [];
  const out = [];
  const err = [];
  const queue = [...replies];
  return {
    calls,
    effects: {
      exists: (file) => existing.includes(file),
      git: (args) => {
        calls.push({ git: args });
        return diff;
      },
      readFalsePositives: () => [],
      readStdinFiles: () => stdinFiles,
      root: '/repo',
      spawn: (args, stdout) => {
        calls.push({ args, stdout });
        return queue.shift() ?? { status: 0, stdout: '' };
      },
      today: () => '2026-10-30',
      workspaceDirs: () => workspaceDirs,
      write: (text) => {
        out.push(text);
      },
      writeError: (text) => {
        err.push(text);
      },
    },
    err,
    out,
  };
};

const json = (value) => ({ status: 0, stdout: JSON.stringify(value) });

describe('runGate — input', () => {
  it('refuses an analysis it does not know', () => {
    const fake = fakeEffects();
    expect(runGate({ argv: ['dupes'], effects: fake.effects })).toBe(
      COULD_NOT_RUN,
    );
    expect(fake.err.join('')).toBe(
      'repo-fallow-gate: usage: repo-fallow-gate <architecture|coverage-gaps|guard|mutation|security|similar-code|suppressions> [--] [file…]\n',
    );
    expect(fake.calls).toEqual([]);
  });

  it('prefers the files on the command line over stdin', () => {
    const fake = fakeEffects({ stdinFiles: ['b.ts'] });
    runGate({ argv: ['guard', '--', '/repo/a.ts'], effects: fake.effects });
    expect(fake.calls[0].args).toEqual(['guard', '--quiet', 'a.ts']);
  });

  it('refuses a line-level analysis without a merge base', () => {
    const fake = fakeEffects({ stdinFiles: ['a.ts'] });
    expect(runGate({ argv: ['security'], effects: fake.effects })).toBe(
      COULD_NOT_RUN,
    );
    expect(fake.err.join('')).toContain('CHANGED_FILES_BASE');
    expect(fake.calls).toEqual([]);
  });

  it('reports a fallow that could not start', () => {
    const fake = fakeEffects({
      replies: [{ error: new Error('spawn fallow ENOENT') }],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['architecture'], effects: fake.effects })).toBe(
      COULD_NOT_RUN,
    );
    expect(fake.err.join('')).toContain(
      'fallow could not start: spawn fallow ENOENT',
    );
  });
});

describe('runGate — analyses judged by their exit code', () => {
  it('runs security on a change that touches no source file', () => {
    const fake = fakeEffects({
      existing: ['.github/workflows/check.yml', 'scripts/run.sh'],
      replies: [{ status: 8 }],
      stdinFiles: ['.github/workflows/check.yml', 'scripts/run.sh'],
    });
    expect(
      runGate({ argv: ['security'], base: 'abc', effects: fake.effects }),
    ).toBe(8);
    expect(fake.calls[0].args[0]).toBe('security');
  });

  it('skips security only when nothing changed at all', () => {
    const fake = fakeEffects({ stdinFiles: ['deleted.yml'] });
    expect(
      runGate({ argv: ['security'], base: 'abc', effects: fake.effects }),
    ).toBe(0);
    expect(fake.out.join('')).toBe(
      'fallow security: no changed file, so there is nothing to check.\n',
    );
    expect(fake.calls).toEqual([]);
  });

  it('skips architecture when no changed file is a source file', () => {
    const fake = fakeEffects({
      existing: ['scripts/run.sh'],
      stdinFiles: ['scripts/run.sh'],
    });
    expect(runGate({ argv: ['architecture'], effects: fake.effects })).toBe(0);
    expect(fake.out.join('')).toBe(
      'fallow architecture: no changed source file, so there is nothing to check.\n',
    );
  });

  it('returns the code fallow returned', () => {
    const fake = fakeEffects({
      replies: [{ status: 8 }],
      stdinFiles: ['a.ts'],
    });
    expect(
      runGate({ argv: ['security'], base: 'abc', effects: fake.effects }),
    ).toBe(8);
    expect(fake.calls[0]).toEqual({
      args: ['security', '--quiet', '--gate', 'new', '--changed-since', 'abc'],
      stdout: 'inherit',
    });
  });

  it('treats a fallow killed by a signal as unable to run', () => {
    const fake = fakeEffects({
      replies: [{ status: null }],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['architecture'], effects: fake.effects })).toBe(
      COULD_NOT_RUN,
    );
  });
});

describe('runGate — analyses judged by their report', () => {
  it('fails on a suppression marker in a changed file and lists it', () => {
    const fake = fakeEffects({
      replies: [
        json({
          files: [
            {
              path: 'a.ts',
              suppressions: [{ kind: 'complexity', line: 4, reason: 'x' }],
            },
          ],
        }),
      ],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['suppressions'], effects: fake.effects })).toBe(1);
    expect(fake.calls[0].stdout).toBe('pipe');
    expect(fake.out.join('')).toContain(
      '1 finding(s) in the changed files:\n\n  a.ts:4  fallow-ignore complexity (x)\n',
    );
  });

  it('lists each finding on its own line', () => {
    const fake = fakeEffects({
      replies: [
        json({
          files: [
            {
              path: 'a.ts',
              suppressions: [
                { kind: 'complexity', line: 4 },
                { kind: 'complexity', line: 8 },
              ],
            },
          ],
        }),
      ],
      stdinFiles: ['a.ts'],
    });
    runGate({ argv: ['suppressions'], effects: fake.effects });
    expect(fake.out.join('')).toBe(
      'fallow suppressions: 2 finding(s) in the changed files:\n\n' +
        '  a.ts:4  fallow-ignore complexity\n' +
        '  a.ts:8  fallow-ignore complexity\n',
    );
  });

  it('passes a clean report and says how many files it read', () => {
    const fake = fakeEffects({
      replies: [json({ files: [] })],
      stdinFiles: ['a.ts', 'b.ts'],
    });
    expect(runGate({ argv: ['suppressions'], effects: fake.effects })).toBe(0);
    expect(fake.out.join('')).toContain(
      'fallow suppressions: no finding in 2 changed source file(s).',
    );
  });

  const gapReport = json({
    coverage_gaps: {
      exports: [
        { export_name: 'added', line: 2, path: 'a.ts' },
        { export_name: 'inherited', line: 9, path: 'a.ts' },
      ],
      files: [],
    },
  });

  it('fails on a coverage gap the diff introduced, and not on an inherited one', () => {
    const fake = fakeEffects({
      diff: {
        status: 0,
        stdout: 'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +2 @@',
      },
      replies: [gapReport],
      stdinFiles: ['a.ts'],
    });
    expect(
      runGate({ argv: ['coverage-gaps'], base: 'abc', effects: fake.effects }),
    ).toBe(1);
    expect(fake.calls[1]).toEqual({
      git: gitDiffArgs({ base: 'abc', files: [] }),
    });
    expect(fake.out.join('')).toBe(
      'fallow coverage-gaps: 1 finding(s) in the changed files:\n\n' +
        '  a.ts:2  no test reaches the export `added`\n',
    );
  });

  it('does not fail on a gap a renamed file inherited', () => {
    const fake = fakeEffects({
      diff: {
        status: 0,
        stdout:
          'diff --git a/old.ts b/a.ts\nsimilarity index 100%\nrename from old.ts\nrename to a.ts',
      },
      replies: [
        json({
          coverage_gaps: {
            exports: [{ export_name: 'inherited', line: 9, path: 'a.ts' }],
            files: [{ path: 'a.ts' }],
          },
        }),
      ],
      stdinFiles: ['a.ts'],
    });
    expect(
      runGate({ argv: ['coverage-gaps'], base: 'abc', effects: fake.effects }),
    ).toBe(0);
  });

  it.each([
    {
      diff: { status: 0, stdout: '' },
      error: 'fallow health exited 2.',
      printed: 'boom',
      reply: { status: 2, stdout: 'boom' },
    },
    {
      diff: { status: 0, stdout: '' },
      error: 'fallow health exited abnormally.',
      printed: '',
      reply: { status: null },
    },
    {
      diff: { status: 128, stdout: '' },
      error: 'git diff against abc failed, so no change can be attributed.',
      printed: '',
      reply: gapReport,
    },
    {
      diff: { exceeded: 536_870_912, status: null, stdout: '' },
      error:
        'git diff against abc is larger than the 536870912 bytes this gate reads, so no change can be attributed.',
      printed: '',
      reply: gapReport,
    },
    {
      diff: { error: new Error('spawn git ENOENT'), stdout: '' },
      error: 'git diff against abc failed, so no change can be attributed.',
      printed: '',
      reply: gapReport,
    },
  ])(
    'cannot judge coverage gaps when a step fails: $error',
    ({ diff, error, printed, reply }) => {
      const fake = fakeEffects({
        diff,
        replies: [reply],
        stdinFiles: ['a.ts'],
      });
      expect(
        runGate({
          argv: ['coverage-gaps'],
          base: 'abc',
          effects: fake.effects,
        }),
      ).toBe(COULD_NOT_RUN);
      expect(fake.err.join('')).toContain(error);
      expect(fake.out.join('')).toBe(printed);
    },
  );

  it('refuses similar-code when the local model is not installed', () => {
    const fake = fakeEffects({
      replies: [json({ model_ready: false })],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['similar-code'], effects: fake.effects })).toBe(
      COULD_NOT_RUN,
    );
    expect(fake.calls).toEqual([
      {
        args: ['similar-code', 'status', '--format', 'json', '--quiet'],
        stdout: 'pipe',
      },
    ]);
    expect(fake.err.join('')).toContain('fallow similar-code setup --local');
  });

  it('refuses a similar-code run that did not complete', () => {
    const fake = fakeEffects({
      replies: [
        json({ model_ready: true }),
        json({ candidates: [], completion: { status: 'partial' } }),
      ],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['similar-code'], effects: fake.effects })).toBe(
      COULD_NOT_RUN,
    );
    expect(fake.calls[1].args).toEqual([
      'similar-code',
      '--format',
      'json',
      '--quiet',
      '--file',
      'a.ts',
    ]);
  });

  it('fails on a similar-code candidate from a complete run', () => {
    const fake = fakeEffects({
      replies: [
        json({ model_ready: true }),
        json({
          candidates: [
            {
              left: { name: 'f', path: 'a.ts', start_line: 1 },
              right: { name: 'g', path: 'b.ts', start_line: 2 },
              similarity: 0.9,
            },
          ],
          completion: { status: 'complete' },
        }),
      ],
      stdinFiles: ['a.ts'],
    });
    expect(runGate({ argv: ['similar-code'], effects: fake.effects })).toBe(1);
  });
});
