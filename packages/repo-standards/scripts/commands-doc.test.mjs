import { describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_RUN_PREFIX,
  documentedTasks,
  requiresRunnerTaskList,
  undocumentedScripts,
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
