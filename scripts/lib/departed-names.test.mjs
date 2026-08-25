import { describe, expect, it } from 'vite-plus/test';

import {
  departedPathReferences,
  departedReferences,
  formatFinding,
  isCheckedFile,
  formatPathFinding,
  parseRoster,
  regularFiles,
  staleAllowances,
} from './departed-names.mjs';

const roster = (extra = {}) =>
  JSON.stringify({
    names: [{ name: 'Oldprod' }, { name: 'apps/legacy' }],
    ...extra,
  });

const allowOf = (path, names) => ({ allow: [{ names, path, reason: 'r' }] });

describe('parseRoster', () => {
  it('reads the names and the allow list', () => {
    const { allow, names } = parseRoster(roster(allowOf('a.md', ['Oldprod'])));

    expect(names).toEqual(['Oldprod', 'apps/legacy']);
    expect([...allow.get('a.md')]).toEqual(['Oldprod']);
  });

  it('refuses a whole-file exemption, which hides the next name to land there', () => {
    expect(() =>
      parseRoster(roster({ allow: [{ path: 'a.md', reason: 'r' }] })),
    ).toThrow(/without naming which names/);
  });

  it('refuses a roster with no names, which would pass every tree', () => {
    expect(() => parseRoster(JSON.stringify({ names: [] }))).toThrow(
      /no names/,
    );
  });

  it('refuses a blank name, which would match every line', () => {
    expect(() =>
      parseRoster(JSON.stringify({ names: [{ name: '  ' }] })),
    ).toThrow(/missing or empty name/);
  });

  it('refuses a row whose `name` key is missing or misspelled', () => {
    // The shape `find` could not catch: it maps to `undefined`, which is also
    // what `find` returns for "nothing matched", so validation passed it and
    // the run died later on `toLowerCase`.
    expect(() =>
      parseRoster(JSON.stringify({ names: [{ note: 'no name' }] })),
    ).toThrow(/missing or empty name/);
  });

  it('refuses a name that is not a string', () => {
    expect(() =>
      parseRoster(JSON.stringify({ names: [{ name: 123 }] })),
    ).toThrow(/missing or empty name/);
  });
});

describe('departedReferences', () => {
  const { allow, names } = parseRoster(
    roster(allowOf('guard.test.mjs', ['Oldprod'])),
  );
  const find = (path, text) =>
    departedReferences({ allow, names, path, text }).filter(
      ({ isAllowed }) => !isAllowed,
    );

  it('reports the line a departed name appears on', () => {
    expect(find('doc.md', 'fine\nthe Oldprod extraction\n')).toEqual([
      { isAllowed: false, line: 2, name: 'Oldprod', path: 'doc.md' },
    ]);
  });

  it('matches case-insensitively, so `oldprod` is the same finding', () => {
    expect(find('doc.md', 'schema: oldprod')).toHaveLength(1);
  });

  it('matches a path name no word boundary spans', () => {
    expect(find('doc.md', 'imports from apps/legacy')).toEqual([
      { isAllowed: false, line: 1, name: 'apps/legacy', path: 'doc.md' },
    ]);
  });

  it('reports each occurrence separately — two lines are two edits', () => {
    expect(find('doc.md', 'Oldprod\nOldprod')).toHaveLength(2);
  });

  it('scans fenced code, where the fixtures that carried these names lived', () => {
    expect(find('doc.md', '```ts\nschema: "Oldprod"\n```')).toHaveLength(1);
  });

  it('hides a name the allow list excuses on that path', () => {
    expect(find('guard.test.mjs', 'Oldprod')).toEqual([]);
  });

  it('still reports a name the allow list does NOT excuse on that path', () => {
    expect(find('guard.test.mjs', 'apps/legacy')).toEqual([
      {
        isAllowed: false,
        line: 1,
        name: 'apps/legacy',
        path: 'guard.test.mjs',
      },
    ]);
  });

  it('does not flag a line that names nothing departed', () => {
    expect(find('doc.md', 'the showcase seeds enterprise_orders')).toEqual([]);
  });
});

describe('isCheckedFile', () => {
  it.each([
    'docs/README.md',
    'scripts/x.mjs',
    'a/b.ts',
    'docker/local/.env.example',
  ])('checks %s', (path) => expect(isCheckedFile(path)).toBe(true));

  it('checks an extensionless text file, such as a git hook', () => {
    expect(isCheckedFile('.vite-hooks/pre-push')).toBe(true);
  });

  it('checks a dotfile whose name is its only segment', () => {
    expect(isCheckedFile('.gitignore')).toBe(true);
  });

  it('skips CHANGELOG.md — generated from git history, not a live pointer', () => {
    expect(isCheckedFile('CHANGELOG.md')).toBe(false);
  });

  it('skips the roster, which names every departed thing by design', () => {
    expect(isCheckedFile('scripts/departed-names.json')).toBe(false);
  });

  it('skips the lockfile', () => {
    expect(isCheckedFile('pnpm-lock.yaml')).toBe(false);
  });

  it('skips a binary', () => {
    expect(isCheckedFile('public/logo.png')).toBe(false);
  });
});

describe('formatFinding', () => {
  it('names the file, the line and what to do instead', () => {
    expect(formatFinding({ line: 7, name: 'Oldprod', path: 'a.md' })).toContain(
      'a.md:7',
    );
    expect(formatFinding({ line: 7, name: 'Oldprod', path: 'a.md' })).toContain(
      'Oldprod',
    );
  });
});

describe('regularFiles', () => {
  const entry = (mode, path) => `${mode} abc123 0\t${path}`;

  it('keeps a regular file', () => {
    expect(regularFiles(`${entry('100644', 'a.md')}\0`)).toEqual(['a.md']);
  });

  it('keeps an executable file', () => {
    expect(regularFiles(`${entry('100755', 'hook')}\0`)).toEqual(['hook']);
  });

  it('drops a symlink — it either is a directory or duplicates a tracked file', () => {
    expect(regularFiles(`${entry('120000', 'CLAUDE.md')}\0`)).toEqual([]);
  });

  it('drops a submodule gitlink, which has no blob to read', () => {
    expect(regularFiles(`${entry('160000', 'vendor//lib')}\0`)).toEqual([]);
  });

  it('keeps the regular files alongside the modes it drops', () => {
    const output = [
      entry('100644', 'a.md'),
      entry('120000', '.claude/skills'),
      entry('100755', 'b.sh'),
    ].join('\0');

    expect(regularFiles(`${output}\0`)).toEqual(['a.md', 'b.sh']);
  });

  it('keeps a path containing a space', () => {
    expect(regularFiles(`${entry('100644', 'a b.md')}\0`)).toEqual(['a b.md']);
  });
});

describe('staleAllowances', () => {
  const allow = new Map([['a.md', new Set(['Oldprod'])]]);

  it('passes an allowance the file still needs', () => {
    expect(
      staleAllowances({
        allow,
        seen: new Set(['a.md\u0000Oldprod']),
        walked: new Set(['a.md']),
      }),
    ).toEqual([]);
  });

  it('reports an allowance for a name the file no longer carries', () => {
    const stale = staleAllowances({
      allow,
      seen: new Set(),
      walked: new Set(['a.md']),
    });

    expect(stale).toHaveLength(1);
    expect(stale[0]).toMatch(/no longer does/);
  });

  it('reports an allowance for a file the scan never read', () => {
    const stale = staleAllowances({
      allow,
      seen: new Set(),
      walked: new Set(),
    });

    expect(stale).toHaveLength(1);
    expect(stale[0]).toMatch(/did not read it/);
  });
});

describe('departedPathReferences', () => {
  const { allow, names } = parseRoster(
    roster(allowOf('a/legacy.md', ['apps/legacy'])),
  );
  const find = (paths) =>
    departedPathReferences({ allow, names, paths }).filter(
      ({ isAllowed }) => !isAllowed,
    );

  it('catches a path that names a departed thing, whatever the contents say', () => {
    expect(find(['apps/legacy/src/x.ts'])).toEqual([
      { isAllowed: false, name: 'apps/legacy', path: 'apps/legacy/src/x.ts' },
    ]);
  });

  it('matches case-insensitively', () => {
    expect(find(['docs/Oldprod-notes.md'])).toHaveLength(1);
  });

  it('leaves a path naming nothing departed alone', () => {
    expect(find(['packages/ui/src/Table/Table.component.tsx'])).toEqual([]);
  });

  it('honours an allowance for that exact path', () => {
    expect(find(['a/legacy.md'])).toEqual([]);
  });

  it('reports every departed name a single path carries', () => {
    expect(find(['apps/legacy/Oldprod.md'])).toHaveLength(2);
  });
});

describe('formatPathFinding', () => {
  it('says the PATH is the reference, so a reader does not grep the contents', () => {
    const message = formatPathFinding({
      name: 'Oldprod',
      path: 'a/Oldprod.md',
    });

    expect(message).toContain('a/Oldprod.md');
    expect(message).toContain('PATH');
  });
});
