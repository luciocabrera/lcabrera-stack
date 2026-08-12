import { describe, expect, it } from 'vite-plus/test';

import {
  describeFinding,
  parseRenameDiff,
  proseLines,
  staleMentions,
  vanishedNames,
} from './renamed-mentions.mjs';

// Like `docs-paths.mjs`, this module's job is PRECISION: the failure mode that
// kills a docs gate is reporting correct prose, so the cases that must NOT be
// reported are tested at least as hard as the ones that must.

describe('parseRenameDiff', () => {
  it('reads the status, old path and new path of each rename', () => {
    const output = [
      'R100\tpackages/scan-ingestion/src/ingestion/ignoredDirectories.constants.ts\tpackages/scan-ingestion/src/ingestion/ingestion.constants.ts',
      'R087\tapps/a/old.types.ts\tapps/a/new.types.ts',
    ].join('\n');

    expect(parseRenameDiff(output)).toEqual([
      {
        from: 'packages/scan-ingestion/src/ingestion/ignoredDirectories.constants.ts',
        to: 'packages/scan-ingestion/src/ingestion/ingestion.constants.ts',
      },
      { from: 'apps/a/old.types.ts', to: 'apps/a/new.types.ts' },
    ]);
  });

  it('ignores a deletion, which has no replacement to point at', () => {
    // Deletions are out of scope on purpose — a name can outlive its tracked
    // file (a `.env` you are told to create, a build output), so a deleted name
    // in prose is not provably stale the way a renamed one is.
    expect(parseRenameDiff('D\tpackages/ui/src/gone.util.ts')).toEqual([]);
  });

  it('returns nothing for an empty diff', () => {
    expect(parseRenameDiff('')).toEqual([]);
  });
});

describe('vanishedNames', () => {
  it('keeps a basename that no tracked file carries any more', () => {
    expect(
      vanishedNames({
        renames: [
          { from: 'packages/a/old.types.ts', to: 'packages/a/new.types.ts' },
        ],
        trackedPaths: ['packages/a/new.types.ts', 'packages/a/index.ts'],
      }),
    ).toEqual([
      { name: 'old.types.ts', replacedBy: 'packages/a/new.types.ts' },
    ]);
  });

  it('drops a file that only moved between directories', () => {
    // The bare name in prose is still true; only the root-anchored path went
    // stale, and `docs:verify` already checks that shape.
    expect(
      vanishedNames({
        renames: [
          { from: 'packages/a/thing.util.ts', to: 'packages/b/thing.util.ts' },
        ],
        trackedPaths: ['packages/b/thing.util.ts'],
      }),
    ).toEqual([]);
  });

  it('drops a basename another tracked file still carries', () => {
    // Deleting one `index.ts` of many must not make every mention of one stale.
    expect(
      vanishedNames({
        renames: [{ from: 'packages/a/index.ts', to: 'packages/a/entry.ts' }],
        trackedPaths: ['packages/a/entry.ts', 'packages/b/index.ts'],
      }),
    ).toEqual([]);
  });

  it('reports one entry per name when a rename set repeats a basename', () => {
    expect(
      vanishedNames({
        renames: [
          { from: 'a/dup.types.ts', to: 'a/one.types.ts' },
          { from: 'b/dup.types.ts', to: 'b/two.types.ts' },
        ],
        trackedPaths: [],
      }),
    ).toHaveLength(1);
  });
});

describe('proseLines', () => {
  it('numbers lines from one', () => {
    expect(proseLines('first\nsecond')).toEqual([
      { number: 1, text: 'first' },
      { number: 2, text: 'second' },
    ]);
  });

  it('drops fenced blocks and the fence lines themselves', () => {
    const markdown = ['before', '```bash', 'inside', '```', 'after'].join('\n');
    expect(proseLines(markdown).map((line) => line.text)).toEqual([
      'before',
      'after',
    ]);
  });

  it('recognises an indented fence inside a list item', () => {
    const markdown = ['- item', '  ```ts', '  inside', '  ```', 'after'].join(
      '\n',
    );
    expect(proseLines(markdown).map((line) => line.text)).toEqual([
      '- item',
      'after',
    ]);
  });
});

describe('staleMentions', () => {
  const vanished = [
    {
      name: 'ignoredDirectories.constants.ts',
      replacedBy:
        'packages/scan-ingestion/src/ingestion/ingestion.constants.ts',
    },
  ];

  it('reports a bare filename in an inline code span', () => {
    const docs = [
      { markdown: 'See `ignoredDirectories.constants.ts`.', path: 'docs/x.md' },
    ];
    expect(staleMentions({ docs, vanished })).toEqual([
      {
        doc: 'docs/x.md',
        line: 1,
        name: 'ignoredDirectories.constants.ts',
        replacedBy:
          'packages/scan-ingestion/src/ingestion/ingestion.constants.ts',
      },
    ]);
  });

  // The regression this gate exists for. #604 renamed the file; ADR-029 went on
  // naming it, the rename sweep and a full CI run both missed it, and #611 fixed
  // it by hand. The prose below is that ADR's line as it stood on `c678c772`.
  it('reports the ADR-029 line #604 left behind', () => {
    const markdown = [
      '## Decision',
      '',
      '- `packProjectArchive.util.ts`: an in-memory fflate zip of the project tree,',
      '  honoring the shared `IGNORED_DIRECTORIES` (extracted from `buildFileInventory`',
      '  into `ignoredDirectories.constants.ts` so packer and inventory cannot drift).',
    ].join('\n');
    const docs = [
      {
        markdown,
        path: 'docs/cqms/decisions/ADR-029-cli-push-and-api-tokens.md',
      },
    ];

    // A dated record is NOT exempt here, unlike the root-anchored corpus check:
    // this fires only on a name the change is renaming right now, which cannot
    // be a path that was merely correct at the time.
    expect(staleMentions({ docs, vanished })).toEqual([
      {
        doc: 'docs/cqms/decisions/ADR-029-cli-push-and-api-tokens.md',
        line: 5,
        name: 'ignoredDirectories.constants.ts',
        replacedBy:
          'packages/scan-ingestion/src/ingestion/ingestion.constants.ts',
      },
    ]);
  });

  it('counts a partial path as the same mention', () => {
    const docs = [
      {
        markdown: 'in `ingestion/ignoredDirectories.constants.ts`',
        path: 'd.md',
      },
    ];
    expect(staleMentions({ docs, vanished })).toHaveLength(1);
  });

  it('strips trailing sentence punctuation before matching', () => {
    const docs = [
      {
        markdown: 'Read `ignoredDirectories.constants.ts`, then stop.',
        path: 'd.md',
      },
    ];
    expect(staleMentions({ docs, vanished })).toHaveLength(1);
  });

  it('ignores a mention inside a fenced block', () => {
    const markdown = ['```', '`ignoredDirectories.constants.ts`', '```'].join(
      '\n',
    );
    expect(
      staleMentions({ docs: [{ markdown, path: 'd.md' }], vanished }),
    ).toEqual([]);
  });

  it('ignores a line that names the replacement too', () => {
    // Recording the move, not following a stale pointer. A dated record that
    // wants to keep the old name writes exactly this shape.
    const markdown =
      'Renamed `ignoredDirectories.constants.ts` to `ingestion.constants.ts`.';
    expect(
      staleMentions({ docs: [{ markdown, path: 'd.md' }], vanished }),
    ).toEqual([]);
  });

  it('ignores a line that names a filename pattern', () => {
    // The suffix tables in `.claude/rules/typescript.md` pair a pattern with an
    // example in the next cell; a rename matching the example is not a pointer.
    const suffixed = [
      {
        name: 'api.constants.ts',
        replacedBy: 'packages/api/src/config/config.constants.ts',
      },
    ];
    const markdown = '| Constant | `*.constants.ts` | `api.constants.ts` |';
    expect(
      staleMentions({ docs: [{ markdown, path: 'd.md' }], vanished: suffixed }),
    ).toEqual([]);
  });

  it('ignores prose that is not in a code span', () => {
    const docs = [
      { markdown: 'See ignoredDirectories.constants.ts.', path: 'd.md' },
    ];
    expect(staleMentions({ docs, vanished })).toEqual([]);
  });

  it('reports every line a document repeats the name on', () => {
    const markdown = [
      '`ignoredDirectories.constants.ts`',
      '',
      'and again `ignoredDirectories.constants.ts`',
    ].join('\n');
    expect(
      staleMentions({ docs: [{ markdown, path: 'd.md' }], vanished }).map(
        (finding) => finding.line,
      ),
    ).toEqual([1, 3]);
  });

  it('reports nothing when the change renamed nothing away', () => {
    const docs = [{ markdown: '`anything.ts`', path: 'd.md' }];
    expect(staleMentions({ docs, vanished: [] })).toEqual([]);
  });
});

describe('describeFinding', () => {
  it('names the document, the line and the replacement path', () => {
    expect(
      describeFinding({
        doc: 'docs/x.md',
        line: 12,
        name: 'old.types.ts',
        replacedBy: 'packages/a/new.types.ts',
      }),
    ).toBe(
      'docs/x.md:12: `old.types.ts` — renamed to `packages/a/new.types.ts`',
    );
  });
});
