import { describe, expect, it } from 'vite-plus/test';

import {
  enforcedTokens,
  extractCandidates,
  isDatedRecord,
  isRootAnchored,
  parseWorkspaceSpecifier,
} from './docs-paths.mjs';

// This module's whole job is PRECISION. A naive "resolve every backticked
// token" pass reports ~830 hits on this repo against ~19 real ones, and a gate
// that cries wolf gets bypassed. Every case below is therefore either a shape
// that must be checked or a shape that must be ignored — the ignores are the
// ones that keep the gate usable, so they are tested just as hard.

describe('isRootAnchored', () => {
  it('accepts a token starting at a real top-level directory', () => {
    expect(isRootAnchored('packages/ui/src/INVENTORY.md')).toBe(true);
    expect(isRootAnchored('apps/react-router')).toBe(true);
    expect(isRootAnchored('.github/skills/react-19/SKILL.md')).toBe(true);
    expect(isRootAnchored('.vite-hooks/commit-msg')).toBe(true);
  });

  it('rejects a directory that is not a real repo root', () => {
    expect(isRootAnchored('src/components/Button')).toBe(false);
    expect(isRootAnchored('node_modules/vitest')).toBe(false);
  });

  it('rejects a bare name with no slash', () => {
    // `packages` alone is prose, not a pointer at anything checkable.
    expect(isRootAnchored('packages')).toBe(false);
    expect(isRootAnchored('AGENTS.md')).toBe(false);
  });

  it('rejects globs, placeholders and regex-ish tokens', () => {
    // The disqualifiers that keep teaching material out of the gate.
    expect(isRootAnchored('apps/*/config/**')).toBe(false);
    expect(isRootAnchored('.claude/rules/<topic>.md')).toBe(false);
    expect(isRootAnchored('packages/{ui,server}/src')).toBe(false);
    expect(isRootAnchored(String.raw`scripts\lib`)).toBe(false);
    expect(isRootAnchored('docs/a|b')).toBe(false);
  });

  it('rejects URLs, absolute paths, anchors and whitespace', () => {
    expect(isRootAnchored('https://example.com/docs/x.md')).toBe(false);
    expect(isRootAnchored('/etc/passwd')).toBe(false);
    expect(isRootAnchored('#section-heading')).toBe(false);
    expect(isRootAnchored('docs/a b.md')).toBe(false);
    expect(isRootAnchored('')).toBe(false);
  });
});

describe('extractCandidates', () => {
  it('picks up root-anchored tokens in inline code spans', () => {
    expect(
      extractCandidates('See `packages/ui/src/PATTERNS.md` first.'),
    ).toEqual(['packages/ui/src/PATTERNS.md']);
  });

  it('enforces a relative link whatever the target extension', () => {
    // The bug this covers: the filter asked for `.md`, so a relative link to a
    // .tsx was never a candidate and could rot indefinitely (#756). Both
    // spellings of the SAME dead pointer must be picked up, or the gate's
    // verdict depends on the file type rather than on whether it resolves.
    expect(extractCandidates('[a](../../apps/x/Nope.tsx)')).toEqual([
      '../../apps/x/Nope.tsx',
    ]);
    expect(extractCandidates('[a](../../apps/x/Nope.md)')).toEqual([
      '../../apps/x/Nope.md',
    ]);
    expect(extractCandidates('[a](./Sibling.util.ts)')).toEqual([
      './Sibling.util.ts',
    ]);
  });

  it('still ignores anchors, URLs and bare parenthesised prose', () => {
    // The counterweight: widening to relative links must not start reporting
    // things that were never paths, or the gate cries wolf and gets bypassed.
    expect(extractCandidates('[a](#section)')).toEqual([]);
    expect(extractCandidates('[a](https://example.com/x.tsx)')).toEqual([]);
    expect(extractCandidates('some prose (Foo.tsx) inline')).toEqual([]);
    expect(extractCandidates('[a](mailto:someone@example.com)')).toEqual([]);
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

    expect(extractCandidates(markdown)).toEqual([
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
      extractCandidates(markdown).toSorted((left, right) =>
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
      extractCandidates(markdown).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual(['../coordination/README.md', '.claude/rules/typescript.md']);
  });

  it('ignores link targets that are neither anchored nor markdown', () => {
    const markdown =
      '[site](https://example.com) [anchor](#heading) [img](logo.png)';
    expect(extractCandidates(markdown)).toEqual([]);
  });

  it('strips heading anchors and trailing sentence punctuation', () => {
    // A path named mid-sentence keeps the comma or full stop attached, and a
    // link may target a heading inside the file.
    const markdown =
      'Read `docs/README.md`, then `scripts/lib/labels.mjs`. Also [x](../a/b.md#why).';

    expect(
      extractCandidates(markdown).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual(['../a/b.md', 'docs/README.md', 'scripts/lib/labels.mjs']);
  });

  it('deduplicates a path named several times', () => {
    const markdown = 'Both `docs/README.md` and `docs/README.md` again.';
    expect(extractCandidates(markdown)).toEqual(['docs/README.md']);
  });

  it('returns nothing for a document with no paths at all', () => {
    expect(
      extractCandidates('# Title\n\nSome prose with `try/catch` in it.'),
    ).toEqual([]);
  });
});

describe('parseWorkspaceSpecifier', () => {
  it('splits a package specifier into name and subpath', () => {
    expect(
      parseWorkspaceSpecifier('@lcabrera/ui/design-system/tokens'),
    ).toEqual({
      packageName: 'ui',
      subpath: 'design-system/tokens',
    });
  });

  it('leaves the subpath undefined for a bare package', () => {
    expect(parseWorkspaceSpecifier('@lcabrera/server')).toEqual({
      packageName: 'server',
      subpath: undefined,
    });
  });

  it('returns undefined for anything not a workspace specifier', () => {
    expect(parseWorkspaceSpecifier('packages/ui/src')).toBeUndefined();
    expect(parseWorkspaceSpecifier('@stylexjs/stylex')).toBeUndefined();
    expect(parseWorkspaceSpecifier('react')).toBeUndefined();
  });

  // The repo has two scopes — @lcabrera/* ships, @repo/* is internal tooling —
  // and the docs name both. A parser that understood only one would quietly
  // validate half of them while still reporting a clean pass.
  it('parses the internal @repo scope too', () => {
    expect(parseWorkspaceSpecifier('@repo/ts-configs/entries')).toEqual({
      packageName: 'ts-configs',
      subpath: 'entries',
    });
  });
});

describe('isDatedRecord', () => {
  it('recognises an ADR in each of the three homes', () => {
    expect(isDatedRecord('docs/decisions/ADR-044-x.md')).toBe(true);
    expect(isDatedRecord('docs/cqms/decisions/ADR-016-x.md')).toBe(true);
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
    expect(enforcedTokens(tokens, ordinary)).toEqual(tokens);
  });

  it('still enforces a relative link inside an ADR', () => {
    // Navigational: the reader is invited to follow it, so it resolves or it
    // is dead. This is the case the old blanket exemption hid — four links
    // broke when 20 ADRs moved up a directory level and nothing reported it.
    expect(enforcedTokens(['../coordination/README.md'], adr)).toEqual([
      '../coordination/README.md',
    ]);
  });

  it('exempts a root-anchored path named inside an ADR', () => {
    // Descriptive: ADR-008 IS the record of the @repo/api -> data-access
    // rename, so naming the old path is its content, not a dead reference.
    expect(enforcedTokens(['packages/data-access'], adr)).toEqual([]);
  });

  it('splits a mixed ADR, keeping only the navigational half', () => {
    expect(
      enforcedTokens(
        ['packages/data-access', '../cqms/STATUS.md', 'docs/agents/gone/'],
        adr,
      ),
    ).toEqual(['../cqms/STATUS.md']);
  });

  it('is empty for an ADR that only names historical paths', () => {
    expect(enforcedTokens(['packages/gone/', 'apps/also-gone/'], adr)).toEqual(
      [],
    );
  });
});
