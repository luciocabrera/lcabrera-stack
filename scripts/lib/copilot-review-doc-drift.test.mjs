import { describe, expect, it } from 'vite-plus/test';

import { ACCEPTED_REVIEWER_LOGINS } from './copilot-review.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

// `docs/tooling/copilot-review-gate.md` carries a copy-pasteable GraphQL command for
// answering "has an accepted reviewer covered this head?" without a checkout. To do
// that it repeats `ACCEPTED_REVIEWERS` as a jq `IN(...)` list — a second copy of the
// roster, in a file no test read until this one.
//
// It drifted immediately: #866 swapped `github-actions` for `claude-general-reviewer`
// in the code and left the snippet naming the old login. A drifted copy is wrong in
// both directions — it reports "no accepted reviewer has reviewed this pull request
// yet — wait" for a head the gate has already passed, and counts a reviewer the gate
// rejects — and someone runs it precisely when the published status looks wrong, which
// is when a confident wrong answer does the most damage.
//
// Comparing the whole list rather than checking for one bad login is deliberate: a
// roster that GAINS a reviewer drifts the same way and would pass a
// `not.toContain('github-actions')` check unchanged.
//
// The file holds the roster TWICE: the jq filter, and the reviewer table a person
// reads first. Both are checked — the table is the one a human trusts, so leaving it
// ungated would police the copy nobody looks at (#866 review).
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
