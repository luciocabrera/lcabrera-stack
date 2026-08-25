import { describe, expect, it } from 'vite-plus/test';

import {
  departedReferences,
  formatFinding,
  isCheckedFile,
  parseRoster,
  regularFiles,
} from './departed-names.mjs';

const roster = (extra = {}) =>
  JSON.stringify({
    names: [{ name: 'Oldprod' }, { name: 'apps/legacy' }],
    ...extra,
  });

describe('parseRoster', () => {
  it('reads the names and the allow list', () => {
    const { allowed, names } = parseRoster(
      roster({ allow: [{ path: 'a.md' }] }),
    );

    expect(names).toEqual(['Oldprod', 'apps/legacy']);
    expect(allowed.has('a.md')).toBe(true);
  });

  it('refuses a roster with no names, which would pass every tree', () => {
    expect(() => parseRoster(JSON.stringify({ names: [] }))).toThrow(
      /no names/,
    );
  });

  it('refuses a blank name, which would match every line', () => {
    expect(() =>
      parseRoster(JSON.stringify({ names: [{ name: '  ' }] })),
    ).toThrow(/empty name/);
  });
});

describe('departedReferences', () => {
  const { allowed, names } = parseRoster(
    roster({ allow: [{ path: 'guard.test.mjs' }] }),
  );
  const find = (path, text) =>
    departedReferences({ allowed, names, path, text });

  it('reports the line a departed name appears on', () => {
    expect(find('doc.md', 'fine\nthe Oldprod extraction\n')).toEqual([
      { line: 2, name: 'Oldprod', path: 'doc.md' },
    ]);
  });

  it('matches case-insensitively, so `oldprod` is the same finding', () => {
    expect(find('doc.md', 'schema: oldprod')).toHaveLength(1);
  });

  it('matches a path name no word boundary spans', () => {
    expect(find('doc.md', 'imports from apps/legacy')).toEqual([
      { line: 1, name: 'apps/legacy', path: 'doc.md' },
    ]);
  });

  it('reports each occurrence separately — two lines are two edits', () => {
    expect(find('doc.md', 'Oldprod\nOldprod')).toHaveLength(2);
  });

  it('scans fenced code, where the fixtures that carried these names lived', () => {
    expect(find('doc.md', '```ts\nschema: "Oldprod"\n```')).toHaveLength(1);
  });

  it('skips a file on the allow list', () => {
    expect(find('guard.test.mjs', 'Oldprod')).toEqual([]);
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
