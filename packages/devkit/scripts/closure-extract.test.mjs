import { describe, expect, test } from 'vite-plus/test';

import {
  extractCommands,
  extractImportSpecifiers,
  extractLinkTargets,
  extractPathTokens,
  isPathToken,
} from './closure-extract.mjs';

describe('extractLinkTargets', () => {
  test('reads the target out of a markdown link', () => {
    expect(extractLinkTargets('see [the doc](../docs/a.md) now')).toEqual([
      { line: 1, target: '../docs/a.md' },
    ]);
  });

  test('reads several links on one line, left to right', () => {
    expect(extractLinkTargets('[a](one.md) and [b](two.md)')).toEqual([
      { line: 1, target: 'one.md' },
      { line: 1, target: 'two.md' },
    ]);
  });

  test('stops cleanly on an unclosed link rather than scanning forever', () => {
    expect(extractLinkTargets(`${'['.repeat(500)}a](`)).toEqual([]);
  });

  test('reads a link whose text is itself code, the spelling skills use', () => {
    expect(
      extractLinkTargets('Read [`docs/a.md`](../../../docs/a.md)'),
    ).toEqual([{ line: 1, target: '../../../docs/a.md' }]);
  });
});

describe('extractCommands', () => {
  test('reads each command in a shell block, including both sides of &&', () => {
    const content = ['```bash', 'vp run test && gh pr ready 4', '```'].join(
      '\n',
    );
    expect(extractCommands(content)).toEqual([
      { line: 2, word: 'vp' },
      { line: 2, word: 'gh' },
    ]);
  });

  test('ignores a fenced block that is not shell', () => {
    const content = ['```ts', "import { vp } from 'x';", '```'].join('\n');
    expect(extractCommands(content)).toEqual([]);
  });

  test('reads an inline command but not an inline path', () => {
    expect(extractCommands('run `vp run test` on `docs/agents/x.md`')).toEqual([
      { line: 1, word: 'vp' },
    ]);
  });

  test('ignores a leading prompt and an environment assignment', () => {
    const content = ['```bash', '$ OUT=x vp run test', '```'].join('\n');
    expect(extractCommands(content)).toEqual([{ line: 2, word: 'vp' }]);
  });
});

describe('extractImportSpecifiers', () => {
  test('reads an import whose specifier is lines below its keyword', () => {
    const content = [
      'import {',
      '  readManifest,',
      '  writeManifest,',
      "} from '@repo/example-scan/deterministic-scan';",
    ].join('\n');
    expect(
      extractImportSpecifiers(content).map((entry) => entry.specifier),
    ).toEqual(['@repo/example-scan/deterministic-scan']);
  });

  test('reads static, side-effect, dynamic and require forms', () => {
    const content = [
      "import { a } from '@repo/example-scan/deterministic-scan';",
      "import './side-effect.mjs';",
      "const b = require('ts-morph');",
      "await import('node:fs');",
    ].join('\n');
    expect(
      extractImportSpecifiers(content).map((entry) => entry.specifier),
    ).toEqual(
      expect.arrayContaining([
        '@repo/example-scan/deterministic-scan',
        './side-effect.mjs',
        'ts-morph',
        'node:fs',
      ]),
    );
  });
});

describe('isPathToken', () => {
  test('accepts an explicitly relative path and a path with an extension', () => {
    expect(isPathToken('./references/advanced.md')).toBe(true);
    expect(isPathToken('packages/example-scan/SCHEMA_V1.md')).toBe(true);
  });

  test('rejects a url, a spaced string and a slashed word with no extension', () => {
    expect(isPathToken('https://example.com/a.md')).toBe(false);
    expect(isPathToken('a b/c.md')).toBe(false);
    expect(isPathToken('feat/797-devkit')).toBe(false);
  });
});

describe('extractPathTokens', () => {
  test('reads a path out of prose backticks and out of a command argument', () => {
    const content = [
      'Follow `packages/example-scan/SCHEMA_V1.md` exactly.',
      '',
      '```bash',
      'node scripts/ingest-report.mjs --run-dir="$OUT"',
      '```',
    ].join('\n');
    expect(extractPathTokens(content)).toEqual([
      { line: 1, token: 'packages/example-scan/SCHEMA_V1.md' },
      { line: 4, token: 'scripts/ingest-report.mjs' },
    ]);
  });

  test('drops trailing prose punctuation that is not part of the path', () => {
    expect(extractPathTokens('see `docs/a.md`, then stop')).toEqual([
      { line: 1, token: 'docs/a.md' },
    ]);
  });
});
