import { describe, expect, it } from 'vite-plus/test';

import {
  enforcedTokens,
  extractCandidates,
  isDatedRecord,
  isRootAnchored,
} from './docs-paths.mjs';

/** A stand-in for whatever layout a consumer declares. */
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
    expect(isRootAnchored('apps/react-router', REPO_ROOTS)).toBe(true);
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
    // `packages` alone is prose, not a pointer at anything checkable.
    expect(isRootAnchored('packages', REPO_ROOTS)).toBe(false);
    expect(isRootAnchored('AGENTS.md', REPO_ROOTS)).toBe(false);
  });

  it('rejects globs, placeholders and regex-ish tokens', () => {
    // The disqualifiers that keep teaching material out of the gate.
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
    // The bug this covers: the filter asked for `.md`, so a relative link to a
    // .tsx was never a candidate and could rot indefinitely (#756). Both
    // spellings of the SAME dead pointer must be picked up, or the gate's
    // verdict depends on the file type rather than on whether it resolves.
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
    // The counterweight: widening to relative links must not start reporting
    // things that were never paths, or the gate cries wolf and gets bypassed.
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
    // Fenced blocks are examples; their paths are illustrative far more often
    // than not, and including them was most of the original false-positive mass.
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
      'Before `apps/react-router/src/routes.ts`',
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
      'apps/react-router/src/routes.ts',
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

  it('ignores link targets that are neither anchored nor markdown', () => {
    const markdown =
      '[site](https://example.com) [anchor](#heading) [img](logo.png)';
    expect(extractCandidates(markdown, REPO_ROOTS)).toEqual([]);
  });

  it('strips heading anchors and trailing sentence punctuation', () => {
    // A path named mid-sentence keeps the comma or full stop attached, and a
    // link may target a heading inside the file.
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
    expect(isDatedRecord('apps/react-router/docs/decisions/ADR-003-x.md')).toBe(
      true,
    );
  });

  it('does not treat an ordinary document as a dated record', () => {
    expect(isDatedRecord('docs/README.md')).toBe(false);
    expect(isDatedRecord('packages/ui/src/PATTERNS.md')).toBe(false);
    // Guards the substring match: a path merely CONTAINING "decision".
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
    // Navigational: the reader is invited to follow it, so it resolves or it
    // is dead. This is the case the old blanket exemption hid — four links
    // broke when 20 ADRs moved up a directory level and nothing reported it.
    expect(
      enforcedTokens({
        docPath: adr,
        repoRoots: REPO_ROOTS,
        tokens: ['../coordination/README.md'],
      }),
    ).toEqual(['../coordination/README.md']);
  });

  it('exempts a root-anchored path named inside an ADR', () => {
    // Descriptive: ADR-008 IS the record of the @repo/api -> data-access
    // rename, so naming the old path is its content, not a dead reference.
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
