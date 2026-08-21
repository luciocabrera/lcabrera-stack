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

/** Every jq author filter in the doc — plural, so a second one cannot slip past. */
const diagnosticFilters = (markdown) => [
  ...markdown.matchAll(/select\(\.author\.login \| IN\(([^)]*)\)\)/gu),
];

/** The logins one such filter names, in the order it names them. */
const loginsIn = (filter) =>
  [...filter[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]);

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
    expect(diagnosticFilters(markdown).length).toBeGreaterThan(0);
    expect(loginsInTable(markdown)).toBeDefined();
  });

  // EVERY filter, not the first one. A second GraphQL snippet added later is another
  // ungated copy — the failure this file exists for — and a check that reads only the
  // first would stay green while it drifted.
  it('every GraphQL diagnostic names exactly the reviewers the gate accepts', () => {
    const filters = diagnosticFilters(readRepoFile(DOC));
    expect(filters.length).toBeGreaterThan(0);
    for (const filter of filters) {
      expect(loginsIn(filter).sort(byName)).toEqual(expected());
    }
  });

  it('the reviewer table names exactly the reviewers the gate accepts', () => {
    const logins = loginsInTable(readRepoFile(DOC));
    expect(logins).toBeDefined();
    expect([...logins].sort(byName)).toEqual(expected());
  });
});
