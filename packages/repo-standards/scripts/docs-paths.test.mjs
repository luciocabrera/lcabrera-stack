import { describe, expect, it } from 'vite-plus/test';

import {
  enforcedTokens,
  extractCandidates,
  isDatedRecord,
  isRootAnchored,
} from './docs-paths.mjs';

const REPO_ROOTS = [
  '.claude',
  '.github',
  '.vite-hooks',
  'apps',
  'docker',
  'docs',
  'packages',
  'reports',
  'scripts',
];

// This module's whole job is PRECISION. A naive "resolve every backticked
// token" pass reports ~830 hits on this repo against ~19 real ones, and a gate
// that cries wolf gets bypassed. Every case below is therefore either a shape
// that must be checked or a shape that must be ignored — the ignores are the
// ones that keep the gate usable, so they are tested just as hard.

describe('isRootAnchored', () => {
  it('accepts a token starting at a real top-level directory', () => {
    expect(isRootAnchored('packages/ui/src/INVENTORY.md', REPO_ROOTS)).toBe(
      true,
    );
    expect(isRootAnchored('apps/showcase', REPO_ROOTS)).toBe(true);
    expect(isRootAnchored('.github/skills/react-19/SKILL.md', REPO_ROOTS)).toBe(
      true,
    );
    expect(isRootAnchored('.vite-hooks/commit-msg', REPO_ROOTS)).toBe(true);
  });

  it('rejects a directory that is not a real repo root', () => {
    expect(isRootAnchored('src/components/Button', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('node_modules/vitest', REPO_ROOTS)).toBe(false);
  });

  it('rejects a bare name with no slash', () => {
    expect(isRootAnchored('packages', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('AGENTS.md', REPO_ROOTS)).toBe(false);
  });

  it('rejects globs, placeholders and regex-ish tokens', () => {
    expect(isRootAnchored('apps/*/config/**', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('.claude/rules/<topic>.md', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('packages/{ui,server}/src', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored(String.raw`scripts\lib`, REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('docs/a|b', REPO_ROOTS)).toBe(false);
  });

  it('rejects URLs, absolute paths, anchors and whitespace', () => {
    expect(isRootAnchored('https://example.com/docs/x.md', REPO_ROOTS)).toBe(
      false,
    );
    expect(isRootAnchored('/etc/passwd', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('#section-heading', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('docs/a b.md', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('', REPO_ROOTS)).toBe(false);
  });
});

describe('extractCandidates', () => {
  it('picks up root-anchored tokens in inline code spans', () => {
    expect(
      extractCandidates('See `packages/ui/src/PATTERNS.md` first.', REPO_ROOTS),
    ).toEqual(['packages/ui/src/PATTERNS.md']);
  });

  it('enforces a relative link whatever the target extension', () => {
    expect(extractCandidates('[a](../../apps/x/Nope.tsx)', REPO_ROOTS)).toEqual(
      ['../../apps/x/Nope.tsx'],
    );
    expect(extractCandidates('[a](../../apps/x/Nope.md)', REPO_ROOTS)).toEqual([
      '../../apps/x/Nope.md',
    ]);
    expect(extractCandidates('[a](./Sibling.util.ts)', REPO_ROOTS)).toEqual([
      './Sibling.util.ts',
    ]);
  });

  it('still ignores anchors, URLs and bare parenthesised prose', () => {
    expect(extractCandidates('[a](#section)', REPO_ROOTS)).toEqual([]);
    expect(
      extractCandidates('[a](https://example.com/x.tsx)', REPO_ROOTS),
    ).toEqual([]);
    expect(
      extractCandidates('some prose (Foo.tsx) inline', REPO_ROOTS),
    ).toEqual([]);
    expect(
      extractCandidates('[a](mailto:someone@example.com)', REPO_ROOTS),
    ).toEqual([]);
  });

  it('ignores everything inside a fenced block', () => {
    const markdown = [
      'Real: `scripts/verify-docs-paths.mjs`',
      '```bash',
      'node scripts/does-not-exist.mjs',
      'cat packages/nope/README.md',
      '```',
    ].join('\n');

    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual([
      'scripts/verify-docs-paths.mjs',
    ]);
  });

  it('keeps prose on both sides of a fenced block', () => {
    const markdown = [
      'Before `apps/showcase/src/routes.ts`',
      '```',
      '`packages/ignored/thing.ts`',
      '```',
      'After `packages/utils/ARCHITECTURE.md`',
    ].join('\n');

    expect(
      extractCandidates(markdown, REPO_ROOTS).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual([
      'apps/showcase/src/routes.ts',
      'packages/utils/ARCHITECTURE.md',
    ]);
  });

  it('picks up relative markdown link targets, anchored or not', () => {
    const markdown =
      'See [the README](../coordination/README.md) and [rules](.claude/rules/typescript.md).';

    expect(
      extractCandidates(markdown, REPO_ROOTS).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual(['../coordination/README.md', '.claude/rules/typescript.md']);
  });

  it('ignores link targets that carry a scheme or are only an anchor', () => {
    const markdown =
      '[site](https://example.com) [anchor](#heading) [tel](tel:+3100000) [mail](mailto:a@example.com)';
    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual([]);
  });

  it('enforces a bare relative link to a non-markdown file', () => {
    expect(
      extractCandidates('[gone](does-not-exist.json)', REPO_ROOTS),
    ).toEqual(['does-not-exist.json']);
    expect(extractCandidates('![logo](logo.png)', REPO_ROOTS)).toEqual([
      'logo.png',
    ]);
    expect(extractCandidates('[dir](sibling-dir/)', REPO_ROOTS)).toEqual([
      'sibling-dir/',
    ]);
  });

  it('enforces the target of a reference-style link definition', () => {
    const markdown = 'See [the facts][gone].\n\n[gone]: does-not-exist.json\n';
    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual([
      'does-not-exist.json',
    ]);
  });

  it('reads a definition target past its title, angle brackets and anchor', () => {
    const markdown = [
      '[a]: ../a/b.md "A title"',
      "[b]: ./c.json 'Single'",
      '[c]: d/e.md (Parenthesised)',
      '[d]: <f/g.md>',
      '  [e]: h.md#section',
      '> [f]: quoted.md',
      '[g]:',
      '  next-line.md',
    ].join('\n');

    expect(
      extractCandidates(markdown, REPO_ROOTS).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual([
      '../a/b.md',
      './c.json',
      'd/e.md',
      'f/g.md',
      'h.md',
      'next-line.md',
      'quoted.md',
    ]);
  });

  it('skips definitions with a scheme, an anchor, a footnote or code indentation', () => {
    const markdown = [
      '[site]: https://example.com/x.md',
      '[mail]: mailto:a@example.com',
      '[top]: #heading',
      '[^note]: Footnote prose, not a target.',
      '    [indented]: code-block.md',
      'prose [inline]: not-at-line-start.md',
      '`[code]: in-a-span.md`',
      '[WIP]: prose that only looks like a definition.',
    ].join('\n');

    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual([]);
  });

  it.each([
    {
      fence: 'a top-level fence',
      lines: ['```markdown', 'BODY', '```'],
    },
    {
      fence: 'a fence nested in a list item',
      lines: ['10. Write the example:', '', '    ```md', '    BODY', '    ```'],
    },
    {
      fence: 'a fence inside a blockquote',
      lines: ['> ```md', '> BODY', '> ```'],
    },
  ])('ignores links and definitions inside $fence', ({ lines }) => {
    const body = [
      'See [the example](inline-in-fence.md).',
      '[gone]: defined-in-fence.md',
    ];
    const markdown = [
      ...lines.flatMap((line) =>
        line.endsWith('BODY')
          ? body.map((entry) => `${line.slice(0, -'BODY'.length)}${entry}`)
          : [line],
      ),
      '',
      '[kept]: after-the-fence.md',
    ].join('\n');

    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual([
      'after-the-fence.md',
    ]);
  });

  it('parses a long whitespace run after a label in bounded time', () => {
    const markdown = `[a]:${' '.repeat(100_000)}<`;
    const started = performance.now();

    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual([]);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it('strips heading anchors and trailing sentence punctuation', () => {
    const markdown =
      'Read `docs/README.md`, then `scripts/lib/labels.mjs`. Also [x](../a/b.md#why).';

    expect(
      extractCandidates(markdown, REPO_ROOTS).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual(['../a/b.md', 'docs/README.md', 'scripts/lib/labels.mjs']);
  });

  it('deduplicates a path named several times', () => {
    const markdown = 'Both `docs/README.md` and `docs/README.md` again.';
    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual(['docs/README.md']);
  });

  it('returns nothing for a document with no paths at all', () => {
    expect(
      extractCandidates(
        '# Title\n\nSome prose with `try/catch` in it.',
        REPO_ROOTS,
      ),
    ).toEqual([]);
  });
});

describe('isDatedRecord', () => {
  it('recognises an ADR in each of the three homes', () => {
    expect(isDatedRecord('docs/decisions/ADR-044-x.md')).toBe(true);
    expect(isDatedRecord('docs/other/decisions/ADR-016-x.md')).toBe(true);
    expect(isDatedRecord('apps/showcase/docs/decisions/ADR-003-x.md')).toBe(
      true,
    );
  });

  it('does not treat an ordinary document as a dated record', () => {
    expect(isDatedRecord('docs/README.md')).toBe(false);
    expect(isDatedRecord('packages/ui/src/PATTERNS.md')).toBe(false);
    expect(isDatedRecord('docs/agents/decision-making.md')).toBe(false);
  });
});

describe('enforcedTokens', () => {
  const adr = 'docs/decisions/ADR-044-x.md';
  const ordinary = 'docs/README.md';

  it('enforces every token in an ordinary document', () => {
    const tokens = ['packages/ui/src/gone.ts', '../sibling.md'];
    expect(
      enforcedTokens({
        docPath: ordinary,
        repoRoots: REPO_ROOTS,
        tokens: tokens,
      }),
    ).toEqual(tokens);
  });

  it('still enforces a relative link inside an ADR', () => {
    expect(
      enforcedTokens({
        docPath: adr,
        repoRoots: REPO_ROOTS,
        tokens: ['../coordination/README.md'],
      }),
    ).toEqual(['../coordination/README.md']);
  });

  it('exempts a root-anchored path named inside an ADR', () => {
    expect(
      enforcedTokens({
        docPath: adr,
        repoRoots: REPO_ROOTS,
        tokens: ['packages/data-access'],
      }),
    ).toEqual([]);
  });

  it('splits a mixed ADR, keeping only the navigational half', () => {
    expect(
      enforcedTokens({
        docPath: adr,
        repoRoots: REPO_ROOTS,
        tokens: [
          'packages/data-access',
          '../other/STATUS.md',
          'docs/agents/gone/',
        ],
      }),
    ).toEqual(['../other/STATUS.md']);
  });

  it('is empty for an ADR that only names historical paths', () => {
    expect(
      enforcedTokens({
        docPath: adr,
        repoRoots: REPO_ROOTS,
        tokens: ['packages/gone/', 'apps/also-gone/'],
      }),
    ).toEqual([]);
  });
});
