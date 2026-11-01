import { describe, expect, it } from 'vite-plus/test';

import { commentRanges, findCommentDirectives } from './comment-directives.mjs';

const PATTERN = /eslint-disable(?:-next-line)?|NOSONAR/gu;

const find = (text, file = 'a.ts') =>
  findCommentDirectives({ file, pattern: PATTERN, text });

const comments = (text, file = 'a.ts') =>
  commentRanges({ file, text }).ranges.map(({ end, pos }) =>
    text.slice(pos, end),
  );

describe('commentRanges', () => {
  it('lists each real comment once, in order', () => {
    expect(comments('/* a */ const x = 1; // b\n// c\nf(/* d */);')).toEqual([
      '/* a */',
      '// b',
      '// c',
      '/* d */',
    ]);
  });

  it('reads no comment in a string, a regex, a template or JSX text', () => {
    expect(comments("const s = '// a'; const r = /\\/\\/b/u;")).toEqual([]);
    expect(comments('const t = `/* c */`;')).toEqual([]);
    expect(comments('const p = <p>// d</p>;', 'a.tsx')).toEqual([]);
  });

  it('reads a comment inside JSX braces and template interpolations', () => {
    expect(comments('const p = <p>x {/* a */}</p>;', 'a.tsx')).toEqual([
      '/* a */',
    ]);
    expect(comments('const t = `${/* b */ x}`;')).toEqual(['/* b */']);
  });

  it.each([
    ['a.mjs', 'const a = 1; // m'],
    ['a.cjs', 'const a = 1; // m'],
    ['a.js', 'const a = 1; // m'],
    ['a.mts', 'const a: number = 1; // m'],
    ['a.cts', 'const a: number = 1; // m'],
    ['a.jsx', 'const a = <b>x</b>; // m'],
    ['a.vue', 'const a = <b>x</b>; // m'],
  ])('parses %s by its extension', (file, text) => {
    expect(comments(text, file)).toEqual(['// m']);
  });

  it('reads a .ts file as TypeScript, where <b> is a type assertion', () => {
    expect(comments('const a = <number>b; // m', 'a.ts')).toEqual(['// m']);
    expect(comments('const a = <number>b; // m', 'a.test.ts')).toEqual([
      '// m',
    ]);
  });

  it('orders the comments by position, not by the order the tree is walked', () => {
    expect(comments('f(/* d */); // e')).toEqual(['/* d */', '// e']);
  });

  it('reads no comment anywhere inside JSX text', () => {
    expect(comments('const p = <p>x // d</p>;', 'a.tsx')).toEqual([]);
    expect(
      comments(
        'const p = (\n  <p>\n    // eslint-disable-next-line x\n    text\n  </p>\n);',
        'a.tsx',
      ),
    ).toEqual([]);
    expect(comments('const p = <p>\n// d</p>;', 'a.tsx')).toEqual([]);
  });
});

describe('findCommentDirectives', () => {
  it('reads nothing from a file with no directive text', () => {
    expect(find('// a comment')).toEqual([]);
  });

  it('reads a directive at the start of a comment, with its line, column and rest', () => {
    expect(
      find('const a = 1;\n  // eslint-disable-next-line no-console -- why'),
    ).toEqual([
      {
        column: 5,
        line: 2,
        rest: ' no-console -- why',
        token: 'eslint-disable-next-line',
      },
    ]);
  });

  it('reads a directive on a line of a block comment, its rest ending at the line', () => {
    expect(find('/**\n * eslint-disable no-console\n * more\n */')).toEqual([
      { column: 3, line: 2, rest: ' no-console', token: 'eslint-disable' },
    ]);
  });

  it('reads two directives in one comment, each with its own rest', () => {
    expect(find('// eslint-disable-next-line a -- why /* NOSONAR */')).toEqual([
      {
        column: 3,
        line: 1,
        rest: ' a -- why /* ',
        token: 'eslint-disable-next-line',
      },
      { column: 40, line: 1, rest: ' */', token: 'NOSONAR' },
    ]);
  });

  it('keeps a reason that mentions a directive in prose', () => {
    expect(
      find('// eslint-disable-next-line a -- why not eslint-disable here'),
    ).toEqual([
      {
        column: 3,
        line: 1,
        rest: ' a -- why not eslint-disable here',
        token: 'eslint-disable-next-line',
      },
    ]);
  });

  it('ignores a directive in the middle of comment prose', () => {
    expect(find('// people reach for eslint-disable here')).toEqual([]);
    expect(find('/* see\n * the eslint-disable rule */')).toEqual([]);
  });

  it('ends the rest at the end of a block comment on one line', () => {
    expect(find('/* eslint-disable x */ const a = 1;')[0].rest).toBe(' x */');
  });
});
