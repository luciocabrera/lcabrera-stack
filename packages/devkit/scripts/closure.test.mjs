import { describe, expect, test } from 'vite-plus/test';

import {
  extractCommands,
  extractImportSpecifiers,
  extractLinkTargets,
  extractPathTokens,
  isPathToken,
} from './closure-extract.mjs';
import { analyseClosure, classifyLink, classifyPathToken } from './closure.mjs';

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

describe('classifyLink', () => {
  const rootDirectory = 'skills/epic';

  test('a sibling file travels with the directory', () => {
    expect(
      classifyLink({
        fromDirectory: 'skills/epic',
        rootDirectory,
        target: './references/contract.md',
      }),
    ).toEqual({
      kind: 'internal',
      resolved: 'skills/epic/references/contract.md',
    });
  });

  test('a parent-relative file escapes it', () => {
    expect(
      classifyLink({
        fromDirectory: 'skills/epic',
        rootDirectory,
        target: '../../docs/agents/orchestration.md',
      }),
    ).toEqual({ kind: 'escape', resolved: 'docs/agents/orchestration.md' });
  });

  test('a url and a bare anchor resolve to nothing on disk', () => {
    expect(
      classifyLink({
        fromDirectory: 'skills/epic',
        rootDirectory,
        target: 'https://example.com/x.md',
      }).kind,
    ).toBe('url');
    expect(
      classifyLink({
        fromDirectory: 'skills/epic',
        rootDirectory,
        target: '#section',
      }).kind,
    ).toBe('anchor');
  });

  test('an absolute path is reported, never resolved as if it were relative', () => {
    for (const target of [
      'C:/dir/file.md',
      String.raw`C:\dir\file.md`,
      '/etc/thing.md',
      String.raw`\\share\thing.md`,
    ]) {
      expect(
        classifyLink({ fromDirectory: 'skills/epic', rootDirectory, target }),
      ).toEqual({ kind: 'escape', resolved: target });
    }
  });

  test('a real scheme is still a url', () => {
    for (const target of ['https://x/y.md', 'mailto:a@b.c', 'ftp://x/y']) {
      expect(
        classifyLink({ fromDirectory: 'skills/epic', rootDirectory, target })
          .kind,
      ).toBe('url');
    }
  });

  test('a prefix match is not containment', () => {
    expect(
      classifyLink({
        fromDirectory: 'skills/epic',
        rootDirectory,
        target: '../epic-notes/a.md',
      }),
    ).toEqual({ kind: 'escape', resolved: 'skills/epic-notes/a.md' });
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
      "} from '@repo/scan-report/deterministic-scan';",
    ].join('\n');
    expect(
      extractImportSpecifiers(content).map((entry) => entry.specifier),
    ).toEqual(['@repo/scan-report/deterministic-scan']);
  });

  test('reads static, side-effect, dynamic and require forms', () => {
    const content = [
      "import { a } from '@repo/scan-report/deterministic-scan';",
      "import './side-effect.mjs';",
      "const b = require('ts-morph');",
      "await import('node:fs');",
    ].join('\n');
    expect(
      extractImportSpecifiers(content).map((entry) => entry.specifier),
    ).toEqual(
      expect.arrayContaining([
        '@repo/scan-report/deterministic-scan',
        './side-effect.mjs',
        'ts-morph',
        'node:fs',
      ]),
    );
  });
});

describe('analyseClosure', () => {
  const rootDirectory = 'skills/epic';

  test('reports nothing for a directory that needs only itself', () => {
    const files = [
      {
        content:
          'See [the contract](./references/contract.md) and run `git status`.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    expect(
      analyseClosure({ allowedCommands: ['git'], files, rootDirectory })
        .escapes,
    ).toEqual([]);
  });

  test('reports a link, a command and an import as distinct kinds', () => {
    const files = [
      {
        content: [
          'Read [the contract](../../docs/agents/contract.md).',
          '',
          '```bash',
          'vp run test',
          '```',
        ].join('\n'),
        path: 'skills/epic/SKILL.md',
      },
      {
        content: "import { scan } from '@repo/scan-report/deterministic-scan';",
        path: 'skills/epic/scripts/run.mjs',
      },
    ];

    const { escapes } = analyseClosure({ files, rootDirectory });
    expect(
      escapes
        .map((finding) => finding.kind)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(['command', 'import', 'link']);
    expect(escapes.find((finding) => finding.kind === 'link')?.resolved).toBe(
      'docs/agents/contract.md',
    );
  });

  test('a node builtin is not an escape, an installed package is', () => {
    const files = [
      {
        content: [
          "import { readFileSync } from 'node:fs';",
          "import 'ts-morph';",
        ].join('\n'),
        path: 'skills/epic/scripts/run.mjs',
      },
    ];
    expect(
      analyseClosure({ files, rootDirectory }).escapes.map(
        (finding) => finding.reference,
      ),
    ).toEqual(['ts-morph']);
  });

  test('an allowed command is not reported, so the config can widen the baseline', () => {
    const files = [
      { content: '```bash\nvp run test\n```', path: 'skills/epic/SKILL.md' },
    ];
    expect(
      analyseClosure({ allowedCommands: ['vp'], files, rootDirectory }).escapes,
    ).toEqual([]);
  });
});

describe('isPathToken', () => {
  test('accepts an explicitly relative path and a path with an extension', () => {
    expect(isPathToken('./references/advanced.md')).toBe(true);
    expect(isPathToken('packages/scan-report/SCHEMA_V1.md')).toBe(true);
  });

  test('rejects a url, a spaced string and a slashed word with no extension', () => {
    expect(isPathToken('https://example.com/a.md')).toBe(false);
    expect(isPathToken('a b/c.md')).toBe(false);
    expect(isPathToken('feat/797-devkit')).toBe(false);
  });
});

describe('classifyPathToken', () => {
  const rootDirectory = 'skills/epic';
  const fromDirectory = 'skills/epic';

  test('prefers the file-relative reading when that is the file that exists', () => {
    const exists = (path) => path === 'skills/epic/references/advanced.md';
    expect(
      classifyPathToken({
        exists,
        fromDirectory,
        rootDirectory,
        token: 'references/advanced.md',
      }),
    ).toEqual({
      kind: 'internal',
      resolved: 'skills/epic/references/advanced.md',
    });
  });

  test('falls back to the repository root, which is where prose usually means', () => {
    const exists = (path) => path === 'packages/scan-report/SCHEMA_V1.md';
    expect(
      classifyPathToken({
        exists,
        fromDirectory,
        rootDirectory,
        token: 'packages/scan-report/SCHEMA_V1.md',
      }),
    ).toEqual({
      kind: 'escape',
      resolved: 'packages/scan-report/SCHEMA_V1.md',
    });
  });

  test('reports nothing when neither reading exists, rather than guessing', () => {
    expect(
      classifyPathToken({
        exists: () => false,
        fromDirectory,
        rootDirectory,
        token: 'some/placeholder.md',
      }),
    ).toEqual({ kind: 'unresolved' });
  });
});

describe('analyseClosure path tokens', () => {
  const rootDirectory = 'skills/epic';

  test('a backticked path outside the directory is an escape', () => {
    const files = [
      {
        content: 'Follow `packages/scan-report/SCHEMA_V1.md` exactly.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    const { escapes } = analyseClosure({
      exists: (path) => path === 'packages/scan-report/SCHEMA_V1.md',
      files,
      rootDirectory,
    });
    expect(escapes).toEqual([
      {
        file: 'skills/epic/SKILL.md',
        kind: 'link',
        line: 1,
        reference: 'packages/scan-report/SCHEMA_V1.md',
        resolved: 'packages/scan-report/SCHEMA_V1.md',
      },
    ]);
  });

  test('a path argument handed to an allowed command is still a dependency', () => {
    const files = [
      {
        content:
          '```bash\nnode packages/scan-report/scripts/ingest-report.mjs\n```',
        path: 'skills/epic/SKILL.md',
      },
    ];
    const { escapes } = analyseClosure({
      allowedCommands: ['node'],
      exists: (path) =>
        path === 'packages/scan-report/scripts/ingest-report.mjs',
      files,
      rootDirectory,
    });
    expect(escapes.map((finding) => finding.resolved)).toEqual([
      'packages/scan-report/scripts/ingest-report.mjs',
    ]);
  });

  test('without an existence check no prose token is analysed', () => {
    const files = [
      {
        content: 'Follow `packages/scan-report/SCHEMA_V1.md` exactly.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    expect(analyseClosure({ files, rootDirectory }).escapes).toEqual([]);
  });
});

describe('extractPathTokens', () => {
  test('reads a path out of prose backticks and out of a command argument', () => {
    const content = [
      'Follow `packages/scan-report/SCHEMA_V1.md` exactly.',
      '',
      '```bash',
      'node scripts/ingest-report.mjs --run-dir="$OUT"',
      '```',
    ].join('\n');
    expect(extractPathTokens(content)).toEqual([
      { line: 1, token: 'packages/scan-report/SCHEMA_V1.md' },
      { line: 4, token: 'scripts/ingest-report.mjs' },
    ]);
  });

  test('drops trailing prose punctuation that is not part of the path', () => {
    expect(extractPathTokens('see `docs/a.md`, then stop')).toEqual([
      { line: 1, token: 'docs/a.md' },
    ]);
  });
});
