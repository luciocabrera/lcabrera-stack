import { describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_RUN_PREFIX,
  documentedTasks,
  requiresRunnerTaskList,
  undocumentedScripts,
  unguardedFilters,
  unresolvedDocumented,
} from './commands-doc.mjs';

const OTHER_RUNNER_DOC = '- `pnpm run adr:verify` — how they run it';

const otherRunnerDocumented = () =>
  documentedTasks({ doc: OTHER_RUNNER_DOC, runPrefix: 'npm run' });

const DOC = [
  '# Commands',
  '',
  '- `npm run adr:verify` — the decision records',
  '- `vp run adr:verify` — the same task, another repository',
  '- `npm  run  lint:check` — spaced out',
  '- `npm install` — not a task',
].join('\n');

describe('documentedTasks', () => {
  test('reads the spelling this repository runs tasks by', () => {
    expect([...documentedTasks({ doc: DOC, runPrefix: 'npm run' })]).toEqual([
      'adr:verify',
      'lint:check',
    ]);
  });

  test('reads only that spelling, so another repository’s is not counted', () => {
    expect([...documentedTasks({ doc: DOC, runPrefix: 'pnpm run' })]).toEqual(
      [],
    );
  });

  test('assumes the prefix the gate assumed before the key existed', () => {
    expect(DEFAULT_RUN_PREFIX).toBe('vp run');
    expect([...documentedTasks({ doc: DOC })]).toEqual(['adr:verify']);
  });

  test('documents nothing for a prefix that is not one', () => {
    expect([
      ...documentedTasks({ doc: DOC, runPrefix: ' '.repeat(3) }),
    ]).toEqual([]);
  });

  test('matches a prefix holding a regular-expression character literally', () => {
    const doc = '- `run.sh build` and `runXsh other`';
    expect([...documentedTasks({ doc, runPrefix: 'run.sh' })]).toEqual([
      'build',
    ]);
  });

  test('reads no task out of a longer runner name that ends in this one', () => {
    expect([...otherRunnerDocumented()]).toEqual([]);
  });
});

describe('requiresRunnerTaskList', () => {
  test('a toolchain resolving tasks from more than the manifests is asked', () => {
    expect(requiresRunnerTaskList('vp run')).toBe(true);
    expect(requiresRunnerTaskList('  vp run  ')).toBe(true);
  });

  test('a package manager runs the manifests, so they are read', () => {
    for (const prefix of ['npm run', 'pnpm run', 'yarn run', 'bun run']) {
      expect(requiresRunnerTaskList(prefix)).toBe(false);
    }
  });
});

describe('what the problems say', () => {
  test('an undocumented script is named with the spelling to write', () => {
    expect(
      undocumentedScripts({
        docName: 'COMMANDS.md',
        documented: new Set(['adr:verify']),
        rootScripts: ['adr:verify', 'pr:verify'],
        runPrefix: 'npm run',
      }),
    ).toEqual([
      'COMMANDS.md does not document the root script `pr:verify` — write it in as `npm run pr:verify`, or delete the script.',
    ]);
  });

  test('a documented command that resolves to nothing is quoted as written', () => {
    expect(
      unresolvedDocumented({
        docName: 'COMMANDS.md',
        documented: new Set(['gone']),
        runPrefix: 'npm run',
        tasks: new Set(['here']),
      }),
    ).toEqual([
      'COMMANDS.md documents `npm run gone`, which is not a task in any workspace — it was renamed or removed.',
    ]);
  });
});

describe('a document carrying a longer runner name that ends in ours', () => {
  test('leaves a script it does not document reported as undocumented', () => {
    expect(
      undocumentedScripts({
        docName: 'COMMANDS.md',
        documented: otherRunnerDocumented(),
        rootScripts: ['adr:verify'],
        runPrefix: 'npm run',
      }),
    ).toEqual([
      'COMMANDS.md does not document the root script `adr:verify` — write it in as `npm run adr:verify`, or delete the script.',
    ]);
  });

  test('and is not reported for a command it never wrote', () => {
    expect(
      unresolvedDocumented({
        docName: 'COMMANDS.md',
        documented: otherRunnerDocumented(),
        runPrefix: 'npm run',
        tasks: new Set(['lint:check']),
      }),
    ).toEqual([]);
  });
});

const unguardedIn = (source, runPrefix) =>
  unguardedFilters({
    commands: [{ source, where: 'root script `x`' }],
    runPrefix,
  }).length;

describe('unguardedFilters', () => {
  test('reports a filtered run that passes when its filter matches nothing', () => {
    expect(
      unguardedFilters({
        commands: [
          { source: 'vp run --filter web dev', where: 'root script `dev`' },
        ],
      }),
    ).toEqual([
      'root script `dev` runs `vp run --filter web dev` without `--fail-if-no-match` — a filter that matches no package then passes having run nothing. Add the flag before the task name.',
    ]);
  });

  test('reads every spelling of a filter', () => {
    expect(unguardedIn('vp run -F web dev')).toBe(1);
    expect(unguardedIn('vp run --filter=web dev')).toBe(1);
    expect(unguardedIn("vp run --filter '@scope/*' build")).toBe(1);
  });

  test('accepts the flag on either side of the filter', () => {
    expect(unguardedIn('vp run --fail-if-no-match --filter web dev')).toBe(0);
    expect(unguardedIn('vp run --filter web --fail-if-no-match dev')).toBe(0);
    expect(unguardedIn('vp run -F web --fail-if-no-match dev')).toBe(0);
  });

  test('does not count a flag the task receives rather than the runner', () => {
    expect(unguardedIn('vp run --filter web dev --fail-if-no-match')).toBe(1);
    expect(unguardedIn('vp run --filter web dev -- --fail-if-no-match')).toBe(
      1,
    );
  });

  test('ignores a filter the task receives', () => {
    expect(unguardedIn('vp run lint -- --filter web')).toBe(0);
    expect(unguardedIn('vp run fallow:dead-code --filter web')).toBe(0);
  });

  test('judges each command of a chain on its own', () => {
    expect(
      unguardedIn(
        'vp run --fail-if-no-match --filter a test && SMOKE=1 vp run --filter b test; vp run -r test | tee log',
      ),
    ).toBe(1);
    expect(unguardedIn('vp run db:up\nvp run --filter web seed')).toBe(1);
  });

  test('skips the value of a valued option before the task', () => {
    expect(unguardedIn('vp run --log labeled --filter web dev')).toBe(1);
    expect(unguardedIn('vp run --concurrency-limit 2 dev')).toBe(0);
  });

  test('ignores a run with no filter, and another runner entirely', () => {
    expect(unguardedIn('vp run -r test')).toBe(0);
    expect(unguardedIn('pnpm run --filter web dev', 'pnpm run')).toBe(0);
    expect(unguardedIn('npm run build', 'npm run')).toBe(0);
  });

  test('does not read a longer command name ending in the prefix', () => {
    expect(unguardedIn('xvp run --filter web dev')).toBe(0);
  });
});
