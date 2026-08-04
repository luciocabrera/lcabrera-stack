import { describe, expect, it } from 'vite-plus/test';

import {
  diffAgainstRegister,
  findBiomeSuppressions,
  findConfigSuppressions,
  findFallowSuppressions,
  findInlineSuppressions,
  globMatches,
  repoWide,
  tally,
  targeted,
} from './suppressions.mjs';

// What these defend: the gate's whole value is that a MISSED suppression looks
// identical to a clean package. Every assertion below started as a way this
// detector reported "nothing here" about something that was there.

const inline = (text) =>
  findInlineSuppressions({ file: 'packages/ui/a.ts', text });

describe('findInlineSuppressions', () => {
  it('reads the rule off a lint directive, stripping the -- trailer', () => {
    const [found] = inline(
      '// eslint-disable-next-line @stylexjs/valid-styles -- anchor positioning',
    );
    expect(found.rule).toBe('@stylexjs/valid-styles');
  });

  it('prefers the longest directive so -next-line is not read as a bare disable', () => {
    const [found] = inline('// oxlint-disable-next-line no-console');
    expect(found.directive).toBe('oxlint-disable-next-line');
  });

  // Regression: reading the trailing words of `@ts-expect-error testing edge
  // case` produced the rule `testing` — a key that looks specific, groups
  // unrelated directives together, and silently drifts when the prose is reworded.
  it('does not mistake prose after @ts-expect-error for a rule name', () => {
    const [found] = inline('// @ts-expect-error testing edge case');
    expect(found.rule).toBe('@ts-expect-error');
  });

  it('reports a bare NOSONAR as itself, since it scopes to no rule', () => {
    const [found] = inline('  // NOSONAR');
    expect(found.rule).toBe('NOSONAR');
  });

  it('marks a rule-less lint directive as unscoped rather than guessing', () => {
    const [found] = inline('/* eslint-disable */');
    expect(found.rule).toBe('eslint-disable (unscoped)');
  });

  it('finds every directive kind, and nothing in ordinary code', () => {
    expect(inline('const eslint = 1; // a normal comment')).toHaveLength(0);
    expect(inline('// biome-ignore lint/style/noShadow: why')).toHaveLength(1);
    expect(inline('// @ts-nocheck')).toHaveLength(1);
  });

  it('counts each occurrence, so a second copy cannot hide behind the first', () => {
    const rows = inline('// @ts-expect-error one\n// @ts-expect-error two');
    expect(rows).toHaveLength(2);
    expect(tally(rows)[0].count).toBe(2);
  });
});

describe('globMatches', () => {
  // Regression: expanding the glob tokens with chained replaceAll rewrote the
  // `*` quantifiers the earlier calls inserted, so `(?:[^/]+/)*` became
  // `(?:[^/]+/)[^/]*`. Every deep path stopped matching and the detector
  // reported 1 Biome scope-off where there were 6 — a silent under-count, the
  // exact failure this whole gate exists to prevent.
  it('matches a deeply nested path through a leading **/', () => {
    expect(
      globMatches({
        glob: '**/SpacerRow.component.tsx',
        path: 'packages/ui/src/components/Table/SpacerRow/SpacerRow.component.tsx',
      }),
    ).toBe(true);
  });

  it('keeps * inside a single segment', () => {
    expect(
      globMatches({ glob: '**/*.test.ts', path: 'packages/ui/a.test.ts' }),
    ).toBe(true);
    expect(globMatches({ glob: '*.ts', path: 'packages/ui/a.ts' })).toBe(false);
  });

  it('anchors, so a suffix match is not a match', () => {
    expect(
      globMatches({ glob: 'packages/ui/**', path: 'apps/x/packages/ui/a.ts' }),
    ).toBe(false);
  });
});

const biomeConfig = (includes, rule) => ({
  overrides: [{ includes, linter: { rules: { a11y: { [rule]: 'off' } } } }],
});

describe('findBiomeSuppressions', () => {
  it('calls a glob targeted when every match is inside a public package', () => {
    const [found] = findBiomeSuppressions({
      config: biomeConfig(
        ['**/SpacerRow.component.tsx'],
        'noAriaHiddenOnFocusable',
      ),
      otherFiles: ['apps/web/Other.tsx'],
      publicFiles: ['packages/ui/src/SpacerRow.component.tsx'],
    });
    expect(found.scope).toBe('targeted');
  });

  // `**/logger.util.ts` reads like a category pattern but resolves to one
  // packages/ui file — the classification has to come from what the glob
  // actually matches, never from how broad it looks.
  it('classifies by resolved matches, not by how generic the pattern looks', () => {
    const [found] = findBiomeSuppressions({
      config: biomeConfig(['**/logger.util.ts'], 'noConsole'),
      otherFiles: ['apps/web/main.ts'],
      publicFiles: ['packages/ui/src/utils/logger/logger.util.ts'],
    });
    expect(found.scope).toBe('targeted');
  });

  it('calls a glob repo-wide when it also reaches outside the packages', () => {
    const [found] = findBiomeSuppressions({
      config: biomeConfig(['**/*.test.ts'], 'noShadow'),
      otherFiles: ['apps/web/a.test.ts'],
      publicFiles: ['packages/ui/a.test.ts'],
    });
    expect(found.scope).toBe('repo-wide');
    expect(targeted([{ ...found }])).toHaveLength(0);
    // But it is NOT dropped — it goes to the acknowledged lane instead. The
    // first version of this gate discarded these, which let a new override wide
    // enough to catch a public package and anything else pass unlisted.
    expect(repoWide([{ ...found }])).toHaveLength(1);
  });

  it('ignores a glob that reaches no public package at all', () => {
    expect(
      findBiomeSuppressions({
        config: biomeConfig(['apps/**'], 'noShadow'),
        otherFiles: ['apps/web/a.ts'],
        publicFiles: ['packages/ui/a.ts'],
      }),
    ).toHaveLength(0);
  });

  it('walks rule groups generically, so a new Biome group cannot slip past', () => {
    const [found] = findBiomeSuppressions({
      config: {
        overrides: [
          {
            includes: ['packages/ui/**'],
            linter: { rules: { somethingNew: { aRule: 'off' } } },
          },
        ],
      },
      otherFiles: [],
      publicFiles: ['packages/ui/a.ts'],
    });
    expect(found.rule).toBe('aRule');
  });

  it('ignores rules that are enabled rather than off', () => {
    expect(
      findBiomeSuppressions({
        config: {
          overrides: [
            {
              includes: ['packages/ui/**'],
              linter: { rules: { a11y: { r: 'error' } } },
            },
          ],
        },
        otherFiles: [],
        publicFiles: ['packages/ui/a.ts'],
      }),
    ).toHaveLength(0);
  });
});

const isPublicPath = (path) => path.startsWith('packages/ui/');

describe('findFallowSuppressions', () => {
  it('finds a baselined finding on a public-package file', () => {
    const found = findFallowSuppressions({
      baselines: {
        health: { finding_counts: { 'packages/ui/a.ts': { crap: 1 } } },
      },
      isPublicPath,
    });
    expect(found).toHaveLength(1);
    expect(found[0].rule).toBe('health:finding_counts');
  });

  // Regression: `target_keys` lists the files fallow treats as HIGH IMPACT when
  // scoring. Counting it reported a suppression on packages/server where there
  // was none — the register would then have carried an approval for a finding
  // that never existed, and the first honest reader would have deleted it.
  it('ignores target_keys, which marks a file as important, not excused', () => {
    expect(
      findFallowSuppressions({
        baselines: {
          health: { target_keys: ['packages/ui/a.ts:high impact'] },
        },
        isPublicPath,
      }),
    ).toHaveLength(0);
  });

  it('splits a clone group so a public package on either side is caught', () => {
    const found = findFallowSuppressions({
      baselines: {
        dupes: { clone_groups: ['apps/web/a.ts:1-9|packages/ui/b.ts:4-12'] },
      },
      isPublicPath,
    });
    expect(found).toHaveLength(1);
    expect(found[0].file).toBe('packages/ui/b.ts');
  });

  it('is quiet when no baseline touches a public package', () => {
    expect(
      findFallowSuppressions({
        baselines: { dead_code: { unused_exports: ['apps/web/a.ts'] } },
        isPublicPath,
      }),
    ).toHaveLength(0);
  });
});

describe('diffAgainstRegister', () => {
  const entry = {
    count: 1,
    key: 'inline packages/ui/a.ts no-console',
    reason: 'a reason long enough to count as an argument',
    ref: 'ADR-000',
  };
  const found = [{ count: 1, key: entry.key }];

  it('passes when the tree matches the register', () => {
    const result = diffAgainstRegister({ found, register: [entry] });
    expect(
      result.grew.concat(
        result.provisional,
        result.stale,
        result.unapproved,
        result.undocumented,
      ),
    ).toHaveLength(0);
  });

  it('flags a suppression with no entry', () => {
    expect(
      diffAgainstRegister({ found, register: [] }).unapproved,
    ).toHaveLength(1);
  });

  it('flags an approved key that grew', () => {
    const result = diffAgainstRegister({
      found: [{ count: 2, key: entry.key }],
      register: [entry],
    });
    expect(result.grew[0].approvedCount).toBe(1);
  });

  // The anti-rot half. Without it an approval outlives the code that justified
  // it and silently pre-authorises whatever next occupies that key — which is
  // how every baseline in this repo started rotting.
  it('flags an entry whose code is gone', () => {
    expect(
      diffAgainstRegister({ found: [], register: [entry] }).stale,
    ).toHaveLength(1);
  });

  it('flags an entry approved for more than the tree holds', () => {
    expect(
      diffAgainstRegister({ found, register: [{ ...entry, count: 3 }] }).stale,
    ).toHaveLength(1);
  });

  it('rejects an entry with a token reason or no reference', () => {
    expect(
      diffAgainstRegister({ found, register: [{ ...entry, reason: 'needed' }] })
        .undocumented,
    ).toHaveLength(1);
    expect(
      diffAgainstRegister({ found, register: [{ ...entry, ref: '' }] })
        .undocumented,
    ).toHaveLength(1);
  });

  // A parked decision is otherwise a perfectly well-formed entry — matched,
  // documented, at the agreed count — so nothing else here would ever fire on
  // it, and it would sit in a green build until someone read a suffix.
  it('flags an otherwise-clean entry that is still provisional', () => {
    const result = diffAgainstRegister({
      found,
      register: [{ ...entry, status: 'provisional' }],
    });
    expect(result.provisional).toHaveLength(1);
    expect(
      result.grew.concat(result.stale, result.unapproved, result.undocumented),
    ).toHaveLength(0);
  });

  // `permanent` is the settled state; an acknowledged (repo-wide) entry carries
  // no status at all, and neither may be turned into a failure by this lane.
  it('leaves a permanent entry and a status-less one alone', () => {
    expect(
      diffAgainstRegister({
        found,
        register: [{ ...entry, status: 'permanent' }],
      }).provisional,
    ).toHaveLength(0);
    expect(
      diffAgainstRegister({ found, register: [entry] }).provisional,
    ).toHaveLength(0);
  });
});

describe('findConfigSuppressions', () => {
  const config = (text) =>
    findConfigSuppressions({ file: 'packages/utils/eslint.config.mjs', text });

  // The seventh way to silence a finding, and one no source file reveals: the
  // whole package simply stops reporting the rule.
  it('flags a rule lowered to off in a package lint config', () => {
    const [found] = config("rules: { 'no-console': 'off' }");
    expect(found.rule).toBe('rule level off');
    expect(found.kind).toBe('config');
  });

  it('flags warn too, since a warning does not fail the build', () => {
    expect(config('rules: { "no-console": "warn" }')).toHaveLength(1);
  });

  // The convention already practised in three of the four packages: pass the
  // rule an option instead of turning it off, so a violation still FAILS.
  it('allows a rule set to error with options', () => {
    expect(
      config(
        "rules: { 'local-rules/filename-convention': ['error', { suffixCase: { util: 'kebab-case' } }] }",
      ),
    ).toHaveLength(0);
  });

  it('only reads files that can carry a rule level', () => {
    expect(
      findConfigSuppressions({
        file: 'packages/ui/src/Thing.tsx',
        text: "const mode = 'off';",
      }),
    ).toHaveLength(0);
  });

  it('reads the Oxlint config too, which lives in vite.config.ts', () => {
    expect(
      findConfigSuppressions({
        file: 'packages/ui/vite.config.ts',
        text: "rules: { 'no-console': 'off' }",
      }),
    ).toHaveLength(1);
  });
});

describe('targeted / repoWide', () => {
  const rows = [
    { key: 'a', scope: 'targeted' },
    { key: 'b', scope: 'repo-wide' },
  ];

  it('splits the two lanes and loses nothing between them', () => {
    expect(targeted(rows).map((row) => row.key)).toEqual(['a']);
    expect(repoWide(rows).map((row) => row.key)).toEqual(['b']);
    expect(targeted(rows).length + repoWide(rows).length).toBe(rows.length);
  });
});

describe('tally', () => {
  it('defaults scope to targeted, since only a Biome glob can be repo-wide', () => {
    expect(
      tally([{ file: 'packages/ui/a.ts', kind: 'inline', rule: 'r' }])[0].scope,
    ).toBe('targeted');
  });

  it('keeps distinct rules in one file apart', () => {
    const rows = tally([
      { file: 'packages/ui/a.ts', kind: 'inline', rule: 'one' },
      { file: 'packages/ui/a.ts', kind: 'inline', rule: 'two' },
    ]);
    expect(rows).toHaveLength(2);
  });
});
