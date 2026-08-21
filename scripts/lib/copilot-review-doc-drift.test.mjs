import { describe, expect, it } from 'vite-plus/test';

import { ACCEPTED_REVIEWER_LOGINS } from './copilot-review.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

// `docs/tooling/copilot-review-gate.md` repeats the roster twice — a reviewer table,
// and a copy-pasteable GraphQL diagnostic that filters on the same logins. Both are
// checked here, because a drifted copy is wrong in BOTH directions and is read exactly
// when the published status looks wrong, which is when it is believed. #866 drifted
// both; review caught it.
//
// Whole-list comparison, not a check for one bad name: a roster that GAINS a reviewer
// drifts identically and would pass `not.toContain('github-actions')` unchanged.
const DOC = 'docs/tooling/copilot-review-gate.md';

/** Order-independent comparison; the two lists need not be written in one order. */
const byName = (left, right) => left.localeCompare(right);

/** The logins the doc's jq filter names, in the order it names them. */
const loginsInDiagnostic = (markdown) => {
  const filter = /select\(\.author\.login \| IN\(([^)]*)\)\)/.exec(markdown);
  if (filter === null) return undefined;
  return [...filter[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
};

/**
 * The logins the reviewer table names, `[bot]` suffix dropped so it compares against
 * the roster's spelling. REST and GraphQL disagree on that suffix, and the doc writes
 * the REST one.
 */
const loginsInTable = (markdown) => {
  const rows = [...markdown.matchAll(/^\| `([a-z\d-]+)\[bot\]` +\|/gmu)];
  return rows.length === 0 ? undefined : rows.map((row) => row[1]);
};

const expected = () => [...ACCEPTED_REVIEWER_LOGINS].sort(byName);

describe('the doc’s copies of the accepted-reviewer set', () => {
  // Guarded separately, and asserted again at each use: an extractor that stops
  // matching should fail on the assertion written for it, not throw a TypeError from
  // spreading `undefined` somewhere else.
  it('both copies are still shaped the way the extractors expect', () => {
    const markdown = readRepoFile(DOC);
    expect(loginsInDiagnostic(markdown)).toBeDefined();
    expect(loginsInTable(markdown)).toBeDefined();
  });

  it('the GraphQL diagnostic names exactly the reviewers the gate accepts', () => {
    const logins = loginsInDiagnostic(readRepoFile(DOC));
    expect(logins).toBeDefined();
    expect([...logins].sort(byName)).toEqual(expected());
  });

  it('the reviewer table names exactly the reviewers the gate accepts', () => {
    const logins = loginsInTable(readRepoFile(DOC));
    expect(logins).toBeDefined();
    expect([...logins].sort(byName)).toEqual(expected());
  });
});
