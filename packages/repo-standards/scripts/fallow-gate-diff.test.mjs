import { describe, expect, it } from 'vite-plus/test';

import {
  introducedChanges,
  joinDiffs,
  parseDiff,
  untrackedFileDiff,
} from './fallow-gate-diff.mjs';

describe('parseDiff', () => {
  const diff = [
    'diff --git a/a.ts b/a.ts',
    'index 1..2 100644',
    '--- a/a.ts',
    '+++ b/a.ts',
    '@@ -3,0 +4,2 @@ export const x = 1;',
    '+one',
    '+two',
    '@@ -10 +12 @@',
    '-old',
    '+new',
    '@@ -20,3 +21,0 @@',
    'diff --git a/gone.ts b/gone.ts',
    '--- a/gone.ts',
    '+++ /dev/null',
    '@@ -1,2 +0,0 @@',
    'diff --git a/new.ts b/new.ts',
    'new file mode 100644',
    '--- /dev/null',
    '+++ b/new.ts',
    '@@ -0,0 +1,3 @@',
  ].join('\n');

  it('reads the added lines of each file, and which files are new', () => {
    expect(parseDiff(diff)).toEqual(
      new Map([
        [
          'a.ts',
          {
            isNew: false,
            ranges: [
              [4, 5],
              [12, 12],
              [21, 20],
            ],
          },
        ],
        ['new.ts', { isNew: true, ranges: [[1, 3]] }],
      ]),
    );
  });

  it('reads a hunk header only at the start of a line', () => {
    expect(
      parseDiff(
        'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n+text @@ -1 +5 @@',
      ),
    ).toEqual(new Map([['a.ts', { isNew: false, ranges: [[1, 1]] }]]));
  });

  it('reads an added line that looks like a file header as content', () => {
    expect(
      parseDiff(
        [
          'diff --git a/a.ts b/a.ts',
          '--- a/a.ts',
          '+++ b/a.ts',
          '@@ -1 +1,2 @@',
          '+++ b/evil.ts',
          '+-- a/evil.ts',
          '@@ -9 +10 @@',
        ].join('\n'),
      ),
    ).toEqual(
      new Map([
        [
          'a.ts',
          {
            isNew: false,
            ranges: [
              [1, 2],
              [10, 10],
            ],
          },
        ],
      ]),
    );
  });

  it('records a file whose change has no hunk, such as a mode change', () => {
    expect(
      parseDiff(
        'diff --git a/run.mjs b/run.mjs\nold mode 100644\nnew mode 100755',
      ),
    ).toEqual(new Map([['run.mjs', { isNew: false, ranges: [] }]]));
  });

  it('ignores header-shaped lines that come before any file', () => {
    expect(parseDiff('+++ b/stray.ts\n@@ -1 +1 @@')).toEqual(new Map());
  });

  it('reads a renamed file under its new path, as not new', () => {
    expect(
      parseDiff(
        [
          'diff --git a/old.ts b/moved.ts',
          'similarity index 100%',
          'rename from old.ts',
          'rename to moved.ts',
          'diff --git a/was.ts b/edited.ts',
          'similarity index 90%',
          'rename from was.ts',
          'rename to edited.ts',
          '--- a/was.ts',
          '+++ b/edited.ts',
          '@@ -4 +4 @@',
        ].join('\n'),
      ),
    ).toEqual(
      new Map([
        ['edited.ts', { isNew: false, ranges: [[4, 4]] }],
        ['moved.ts', { isNew: false, ranges: [] }],
      ]),
    );
  });

  it('reads an empty diff as no change', () => {
    expect(parseDiff('')).toEqual(new Map());
  });
});

describe('introducedChanges', () => {
  it('treats a changed file the diff does not list as wholly new', () => {
    expect(
      introducedChanges({
        diff: 'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@',
        files: ['a.ts', 'untracked.ts'],
      }),
    ).toEqual(
      new Map([
        ['a.ts', { isNew: false, ranges: [[1, 1]] }],
        ['untracked.ts', { isNew: true, ranges: [] }],
      ]),
    );
  });
});

describe('joinDiffs', () => {
  it('joins an empty tracked diff and two new files with no blank line', () => {
    expect(
      joinDiffs([
        '',
        untrackedFileDiff({ content: 'a\n', path: 'one.mjs' }),
        untrackedFileDiff({ content: 'b\n', path: 'two.mjs' }),
      ]),
    ).toBe(
      [
        'diff --git a/one.mjs b/one.mjs',
        'new file mode 100644',
        '--- /dev/null',
        '+++ b/one.mjs',
        '@@ -0,0 +1,1 @@',
        '+a',
        'diff --git a/two.mjs b/two.mjs',
        'new file mode 100644',
        '--- /dev/null',
        '+++ b/two.mjs',
        '@@ -0,0 +1,1 @@',
        '+b',
        '',
      ].join('\n'),
    );
  });

  it('ends a tracked diff that git trimmed with a newline before the next file', () => {
    expect(joinDiffs(['diff --git a/x b/x\n@@ -1 +1 @@\n+x', 'y\n'])).toBe(
      'diff --git a/x b/x\n@@ -1 +1 @@\n+x\ny\n',
    );
  });

  it('writes nothing for nothing', () => {
    expect(joinDiffs(['', '\n'])).toBe('');
  });
});

describe('untrackedFileDiff', () => {
  it('writes a new file as one hunk adding every line', () => {
    expect(untrackedFileDiff({ content: 'one\ntwo\n', path: 'n.mjs' })).toBe(
      [
        'diff --git a/n.mjs b/n.mjs',
        'new file mode 100644',
        '--- /dev/null',
        '+++ b/n.mjs',
        '@@ -0,0 +1,2 @@',
        '+one',
        '+two',
        '',
      ].join('\n'),
    );
  });

  it('counts a last line with no newline', () => {
    expect(untrackedFileDiff({ content: 'one\ntwo', path: 'n.mjs' })).toContain(
      '@@ -0,0 +1,2 @@\n+one\n+two\n',
    );
  });

  it('reads back as a new file covering every line', () => {
    expect(
      parseDiff(untrackedFileDiff({ content: 'a\nb\nc\n', path: 'n.mjs' })),
    ).toEqual(new Map([['n.mjs', { isNew: true, ranges: [[1, 3]] }]]));
  });
});
