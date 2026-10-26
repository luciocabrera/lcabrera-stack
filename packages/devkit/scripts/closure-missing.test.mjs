import { describe, expect, test } from 'vite-plus/test';

import { analyseClosure } from './closure.mjs';

describe('analyseClosure scripts that exist nowhere', () => {
  const path = '.github/skills/demo/SKILL.md';

  const analyse = ({ content, present = [], shipped = [path] }) =>
    analyseClosure({
      allowedCommands: ['node', 'bash'],
      exists: (candidate) => present.includes(candidate),
      files: [{ content, path }],
      rootDirectory: '',
      shipped: new Set(shipped),
    }).escapes;

  test('an inline command running a script nothing holds is a finding', () => {
    expect(
      analyse({ content: 'Run `node scripts/moved-away.mjs` first.' }),
    ).toEqual([
      {
        file: path,
        kind: 'missing',
        line: 1,
        reference: 'scripts/moved-away.mjs',
      },
    ]);
  });

  test('a fenced command running a script nothing holds is a finding', () => {
    expect(
      analyse({
        content: '```bash\nFOO=1 bash --norc ./scripts/gone.sh --apply\n```',
      }).map((finding) => [finding.kind, finding.reference]),
    ).toEqual([['missing', './scripts/gone.sh']]);
  });

  test('a script the shipped set carries is not a finding', () => {
    expect(
      analyse({
        content: 'Run `node scripts/placed.mjs`.',
        shipped: [path, 'scripts/placed.mjs'],
      }),
    ).toEqual([]);
  });

  test('a script that exists is judged by containment, not reported missing', () => {
    expect(
      analyse({
        content: 'Run `node scripts/repo-only.mjs`.',
        present: ['scripts/repo-only.mjs'],
      }).map((finding) => finding.kind),
    ).toEqual(['link']);
  });

  test('a path that is only named, not run, is not reported missing', () => {
    expect(analyse({ content: 'Routes live in `app/routes.ts`.' })).toEqual([]);
  });

  test('a placeholder operand is not reported missing', () => {
    expect(
      analyse({ content: 'Run `node scripts/<name>.mjs` for each one.' }),
    ).toEqual([]);
  });
});
