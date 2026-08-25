import { describe, expect, test } from 'vite-plus/test';

import { analyseClosure, classifyLink, classifyPathToken } from './closure.mjs';

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

  test('a link to a directory the package fills travels with it', () => {
    // `[in this directory](./)` is the ordinary way a page points at the folder
    // it sits in. Containment is judged against the shipped FILES, and a
    // directory is in no set of files, so without this a page is reported as an
    // escape for naming its own home.
    expect(
      classifyLink({
        fromDirectory: 'docs/decisions',
        rootDirectory: '',
        shipped: new Set(['docs/decisions/README.md']),
        target: './',
      }),
    ).toEqual({ kind: 'internal', resolved: 'docs/decisions' });
  });

  test('a directory the package fills nothing of still escapes', () => {
    // The prefix has to end at a directory boundary rather than anywhere in a
    // name: `docs/dec` must not read as internal because a shipped path happens
    // to start with those characters.
    expect(
      classifyLink({
        fromDirectory: '',
        rootDirectory: 'skills/epic',
        shipped: new Set(['docs/decisions/README.md']),
        target: 'docs/dec',
      }),
    ).toEqual({ kind: 'escape', resolved: 'docs/dec' });
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
        content:
          "import { scan } from '@repo/example-scan/deterministic-scan';",
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
    const exists = (path) => path === 'packages/example-scan/SCHEMA_V1.md';
    expect(
      classifyPathToken({
        exists,
        fromDirectory,
        rootDirectory,
        token: 'packages/example-scan/SCHEMA_V1.md',
      }),
    ).toEqual({
      kind: 'escape',
      resolved: 'packages/example-scan/SCHEMA_V1.md',
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

describe('analyseClosure deduplication and the shipped set', () => {
  const rootDirectory = 'skills/epic';

  test('a link whose text repeats its target is one dependency, not two', () => {
    const files = [
      {
        content: 'Read [`docs/a.md`](../../docs/a.md) first.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    const { escapes } = analyseClosure({
      exists: (path) => path === 'docs/a.md',
      files,
      rootDirectory,
    });
    expect(escapes).toHaveLength(1);
    expect(escapes[0].resolved).toBe('docs/a.md');
  });

  test('a reference the package also ships travels with it', () => {
    const files = [
      {
        content: 'Read [the contract](../../docs/a.md) first.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    expect(
      analyseClosure({
        files,
        rootDirectory,
        shipped: new Set(['docs/a.md']),
      }).escapes,
    ).toEqual([]);
  });

  test('a relative import between two shipped files is not an escape', () => {
    // Pins the `--shipped` mode, where rootDirectory is empty on purpose: the
    // shipped set is the ONLY thing making a reference internal, so an import
    // that does not consult it reports every shipped script as an escape.
    const files = [
      {
        content: "import { scan } from './helper.mjs';",
        path: 'skills/epic/scripts/run.mjs',
      },
    ];
    expect(
      analyseClosure({
        files,
        rootDirectory: '',
        shipped: new Set(['skills/epic/scripts/helper.mjs']),
      }).escapes,
    ).toEqual([]);
  });

  test('a sibling skill in the same package is not an escape', () => {
    const files = [
      {
        content: 'Use the [commit-and-pr](../commit-and-pr/SKILL.md) skill.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    expect(
      analyseClosure({
        files,
        rootDirectory,
        shipped: new Set(['skills/commit-and-pr/SKILL.md']),
      }).escapes,
    ).toEqual([]);
  });
});

describe('analyseClosure path tokens', () => {
  const rootDirectory = 'skills/epic';

  test('a backticked path outside the directory is an escape', () => {
    const files = [
      {
        content: 'Follow `packages/example-scan/SCHEMA_V1.md` exactly.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    const { escapes } = analyseClosure({
      exists: (path) => path === 'packages/example-scan/SCHEMA_V1.md',
      files,
      rootDirectory,
    });
    expect(escapes).toEqual([
      {
        file: 'skills/epic/SKILL.md',
        kind: 'link',
        line: 1,
        reference: 'packages/example-scan/SCHEMA_V1.md',
        resolved: 'packages/example-scan/SCHEMA_V1.md',
      },
    ]);
  });

  test('a path argument handed to an allowed command is still a dependency', () => {
    const files = [
      {
        content:
          '```bash\nnode packages/example-scan/scripts/ingest-report.mjs\n```',
        path: 'skills/epic/SKILL.md',
      },
    ];
    const { escapes } = analyseClosure({
      allowedCommands: ['node'],
      exists: (path) =>
        path === 'packages/example-scan/scripts/ingest-report.mjs',
      files,
      rootDirectory,
    });
    expect(escapes.map((finding) => finding.resolved)).toEqual([
      'packages/example-scan/scripts/ingest-report.mjs',
    ]);
  });

  test('without an existence check no prose token is analysed', () => {
    const files = [
      {
        content: 'Follow `packages/example-scan/SCHEMA_V1.md` exactly.',
        path: 'skills/epic/SKILL.md',
      },
    ];
    expect(analyseClosure({ files, rootDirectory }).escapes).toEqual([]);
  });
});
