import { describe, expect, it } from 'vite-plus/test';

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseCommitHeader,
  validateBranchName,
  validateCommitMessage,
  validateIssueBody,
  validatePrBase,
  validatePrBody,
  validatePrTitle,
} from './commit-convention.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// This module is the ONE spec behind the commit-msg hook, the PR-standards CI
// gate, the changelog generator and the PR labeler. AGENTS.md Rule 13 forbids
// restating its type list anywhere else precisely so those four cannot drift —
// which makes the spec itself the thing that has to be pinned.

// A Set, matching what the hook and CI gate pass in.
const workspaces = new Set(['ui', 'server', 'admin_system', 'api-server']);
const errorsOf = (result) => result.errors;

describe('parseCommitHeader', () => {
  it('splits a conventional header into its parts', () => {
    expect(parseCommitHeader('feat(ui): add a Table filter')).toEqual({
      breaking: false,
      scope: 'ui',
      subject: 'add a Table filter',
      type: 'feat',
    });
  });

  it('reads the breaking-change marker and normalises the type case', () => {
    expect(
      parseCommitHeader('FIX(server)!: drop the legacy column'),
    ).toMatchObject({
      breaking: true,
      type: 'fix',
    });
  });

  it('leaves scope undefined when there is none', () => {
    expect(parseCommitHeader('docs: explain the gate')).toMatchObject({
      scope: undefined,
      type: 'docs',
    });
  });

  it('returns null for a non-conventional header', () => {
    expect(parseCommitHeader('added some stuff')).toBeNull();
    expect(parseCommitHeader('feat:no space after colon')).toBeNull();
    expect(parseCommitHeader('')).toBeNull();
    expect(parseCommitHeader(undefined)).toBeNull();
  });

  it('stays lenient about unknown types — shape only', () => {
    // The changelog generator and labeler need the shape without a verdict.
    expect(parseCommitHeader('wip(ui): something')).toMatchObject({
      type: 'wip',
    });
  });
});

describe('validateCommitMessage', () => {
  it('accepts a well-formed message', () => {
    const result = validateCommitMessage('feat(ui): add a Table filter', {
      workspaces,
    });
    expect(result).toMatchObject({ errors: [], skipped: false });
  });

  it('rejects a malformed header', () => {
    expect(
      errorsOf(validateCommitMessage('added some stuff', { workspaces })),
    ).not.toEqual([]);
  });

  it('rejects a type outside the allowed list', () => {
    expect(
      errorsOf(validateCommitMessage('wip(ui): something', { workspaces })),
    ).not.toEqual([]);
  });

  it('rejects an empty message', () => {
    expect(errorsOf(validateCommitMessage('', { workspaces }))).not.toEqual([]);
  });

  it('only WARNS about an unrecognised scope', () => {
    // A new area should not be blocked by the gate — deliberate, so scopes can
    // lead the workspace list rather than lag it.
    const result = validateCommitMessage('feat(nonexistent): x', {
      workspaces,
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).not.toEqual([]);
  });

  it('skips merge, revert and fixup messages', () => {
    for (const header of [
      "Merge branch 'main' into feature",
      'Merge pull request #123 from x/y',
      'Revert "feat(ui): add a Table filter"',
      'fixup! feat(ui): add a Table filter',
    ]) {
      expect(validateCommitMessage(header, { workspaces })).toMatchObject({
        errors: [],
        skipped: true,
      });
    }
  });

  it('accepts a body and a Co-Authored-By trailer', () => {
    const raw = [
      'fix(server): close the pool on shutdown',
      '',
      'Long explanation of why.',
      '',
      'Co-Authored-By: Someone <someone@example.com>',
    ].join('\n');

    expect(errorsOf(validateCommitMessage(raw, { workspaces }))).toEqual([]);
  });
});

describe('validatePrTitle', () => {
  it('holds a PR title to the same shape as a commit header', () => {
    expect(
      errorsOf(validatePrTitle('feat(ui): add a Table filter', { workspaces })),
    ).toEqual([]);
    expect(
      errorsOf(validatePrTitle('just some changes', { workspaces })),
    ).not.toEqual([]);
  });
});

// Every section the template ships, as headings. Built once so a test that
// varies ONE section cannot accidentally pass by dropping another.
const prSection = {
  what: '## What\n\nDid a thing.',
  why: '## Why\n\nIt was broken.',
  verification: '## Verification\n\nRan the gate.',
  impact: '## Impact Analysis\n\nNone.',
  coverage: '## Test Coverage\n\nNone.',
  documentation: '## Documentation Updates\n\nNone.',
};
const fullPrBody = (overrides = {}) =>
  Object.entries({ ...prSection, ...overrides })
    .filter(([, value]) => value !== undefined)
    .map(([, value]) => value)
    .join('\n\n');

describe('validatePrBody', () => {
  it('accepts a body with every required section', () => {
    expect(errorsOf(validatePrBody(fullPrBody()))).toEqual([]);
  });

  it('accepts any of the Verification aliases', () => {
    for (const heading of [
      'Verification',
      'Testing',
      'Test plan',
      'QA',
      'Tests',
    ]) {
      expect(
        errorsOf(
          validatePrBody(fullPrBody({ verification: `## ${heading}\n\ny` })),
        ),
      ).toEqual([]);
    }
  });

  it.each(Object.keys(prSection))('rejects a body missing %s', (section) => {
    expect(
      errorsOf(validatePrBody(fullPrBody({ [section]: undefined }))),
    ).not.toEqual([]);
  });

  it('requires a heading, not the bare word somewhere in the prose', () => {
    // `body.includes('What')` would pass this; a heading match must not.
    const prose =
      'What we did: a thing. Why: it broke. Verification: ran it. ' +
      'Impact Analysis, Test Coverage and Documentation Updates all considered.';
    expect(errorsOf(validatePrBody(prose))).not.toEqual([]);
  });

  it('rejects an empty body', () => {
    expect(errorsOf(validatePrBody(''))).not.toEqual([]);
    expect(errorsOf(validatePrBody(undefined))).not.toEqual([]);
  });
});

describe('validateBranchName', () => {
  it.each([
    'feat/123-add-column-resize',
    'fix/88-null-pointer',
    'chore/294-agent-templates',
    'ci/301-skip-pending-changesets',
    'refactor/7-a',
  ])('accepts %s', (branch) => {
    expect(errorsOf(validateBranchName(branch))).toEqual([]);
  });

  it.each([
    ['agent-doc-symlinks', 'no type prefix'],
    ['feat/add-pagination', 'no issue number'],
    ['feature/12-x', 'type is not a commit type'],
    ['feat/123-Add-Pagination', 'not kebab-case'],
    ['feat/123-', 'empty description'],
    ['feat//123-x', 'empty type segment'],
  ])('rejects %s (%s)', (branch) => {
    expect(errorsOf(validateBranchName(branch))).not.toEqual([]);
  });

  it.each(['main', 'release-v0-1-1'])('exempts %s', (branch) => {
    const result = validateBranchName(branch);
    expect(result.exempt).toBe(true);
    expect(errorsOf(result)).toEqual([]);
  });

  it('rejects an empty branch name rather than exempting it', () => {
    expect(validateBranchName('').exempt).toBe(false);
    expect(errorsOf(validateBranchName(''))).not.toEqual([]);
  });

  // The claim script is bash and cannot import this module, so it repeats the
  // type list. Assert the two agree — a divergence should fail here, not show
  // up as a rejected push after the branch already exists.
  it('agrees with the type list coordination-claim.sh accepts', () => {
    const script = readFileSync(
      join(REPO_ROOT, 'scripts', 'coordination-claim.sh'),
      'utf8',
    );
    const line = /\n\s*(feat\|[a-z|]+)\)\s*;;/.exec(script);
    expect(line, 'type case-list not found in coordination-claim.sh').not.toBe(
      null,
    );
    for (const type of line[1].split('|')) {
      expect(errorsOf(validateBranchName(`${type}/1-x`))).toEqual([]);
    }
  });
});

describe('validatePrBase — the #367 stacked-merge guard', () => {
  it('accepts `main` and release branches', () => {
    expect(errorsOf(validatePrBase('main'))).toEqual([]);
    expect(errorsOf(validatePrBase('release-1.2'))).toEqual([]);
  });

  it('rejects a feature branch as a PR base', () => {
    const result = validatePrBase('refactor/352-distinct-onto-getpool');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('retarget to `main`');
  });

  it('does not check an empty base (local simulation with no PR context)', () => {
    expect(errorsOf(validatePrBase(''))).toEqual([]);
    expect(errorsOf(validatePrBase(undefined))).toEqual([]);
  });

  it('allows a declared shared branch, but warns it must merge to main', () => {
    const result = validatePrBase('shared/epic-x', {
      allowedBases: ['shared/epic-x'],
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it('still rejects a feature branch that is not among the declared shared branches', () => {
    expect(
      errorsOf(validatePrBase('feat/x', { allowedBases: ['shared/epic-x'] })),
    ).toHaveLength(1);
  });
});

const DEPENDENCIES_BLOCK = [
  '```yaml',
  'dependencies:',
  '  blocking: []',
  '  blockedBy: []',
  '  parent: null',
  '  children: []',
  '```',
].join('\n');

const issueSection = {
  problem: '## 1. Problem Statement\n\nIt is broken.',
  objective: '## 2. Objective / Desired Outcome\n\nNot broken.',
  context: '## 3. Context & Background\n\nSince #12.',
  scope: '## 5. Scope Definition\n\nIn: x. Out: y.',
  acceptance: '## 6. Acceptance Criteria\n\n- [ ] Fixed',
  planning: `## 9. Planning Metadata\n\n${DEPENDENCIES_BLOCK}`,
};
const fullIssueBody = (overrides = {}) =>
  Object.entries({ ...issueSection, ...overrides })
    .filter(([, value]) => value !== undefined)
    .map(([, value]) => value)
    .join('\n\n');

describe('validateIssueBody', () => {
  it('accepts a body with every required section', () => {
    expect(errorsOf(validateIssueBody(fullIssueBody()))).toEqual([]);
  });

  it('accepts the sections unnumbered', () => {
    const unnumbered = fullIssueBody().replaceAll(/## \d+\. /g, '## ');
    expect(errorsOf(validateIssueBody(unnumbered))).toEqual([]);
  });

  it.each(Object.keys(issueSection))('rejects a body missing %s', (section) => {
    expect(
      errorsOf(validateIssueBody(fullIssueBody({ [section]: undefined }))),
    ).not.toEqual([]);
  });

  it('rejects the context-free issue this rule exists to stop', () => {
    // One per missing section, plus one for the absent `dependencies:` block.
    expect(
      errorsOf(validateIssueBody('it is broken, please fix')),
    ).toHaveLength(Object.keys(issueSection).length + 1);
  });

  it('rejects a Planning Metadata heading with no dependencies block under it', () => {
    // The heading alone is what a shape-only check would accept, and it carries
    // none of the information the convention exists for.
    const empty = fullIssueBody({
      planning: '## 9. Planning Metadata\n\nNone.',
    });
    expect(errorsOf(validateIssueBody(empty))).toEqual([
      expect.stringContaining('`dependencies:` block'),
    ]);
  });

  it.each(['blocking', 'blockedBy', 'parent', 'children'])(
    'rejects a dependencies block missing %s',
    (key) => {
      const partial = fullIssueBody({
        planning: `## 9. Planning Metadata\n\n${DEPENDENCIES_BLOCK.split('\n')
          .filter((line) => !line.trim().startsWith(`${key}:`))
          .join('\n')}`,
      });
      expect(errorsOf(validateIssueBody(partial))).toEqual([
        expect.stringContaining(`\`${key}:\``),
      ]);
    },
  );

  it('accepts a block that declares real relationships', () => {
    const linked = fullIssueBody({
      planning: [
        '## 9. Planning Metadata',
        '',
        '```yaml',
        'dependencies:',
        '  blocking: [#410]',
        '  blockedBy: []',
        '  parent: #392',
        '  children: []',
        '```',
      ].join('\n'),
    });
    expect(errorsOf(validateIssueBody(linked))).toEqual([]);
  });

  it('rejects an empty body', () => {
    expect(errorsOf(validateIssueBody(''))).not.toEqual([]);
    expect(errorsOf(validateIssueBody(undefined))).not.toEqual([]);
  });
});

describe('vague commit subjects', () => {
  it.each([
    'chore: misc updates',
    'fix: wip',
    'docs: various things',
    'chore(ui): update code',
  ])('rejects %s', (message) => {
    expect(
      errorsOf(validateCommitMessage(message, { workspaces })),
    ).not.toEqual([]);
  });

  it('matches whole words only', () => {
    expect(
      errorsOf(
        validateCommitMessage('fix(ui): handle a miscellaneous-looking edge', {
          workspaces,
        }),
      ),
    ).toEqual([]);
  });
});
