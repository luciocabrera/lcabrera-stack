import { describe, expect, it } from 'vite-plus/test';

import { ACCEPTED_REVIEWER_LOGINS } from './copilot-review.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

const DOC = 'docs/tooling/copilot-review-gate.md';

const byName = (left, right) => left.localeCompare(right);

const diagnosticFilters = (markdown) => [
  ...markdown.matchAll(/select\(\.author\.login \| IN\(([^)]*)\)\)/gu),
];

const loginsIn = (filter) =>
  [...filter[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]);

const loginsInTable = (markdown) => {
  const rows = [...markdown.matchAll(/^\| `([a-z\d-]+)\[bot\]` +\|/gmu)];
  return rows.length === 0 ? undefined : rows.map((row) => row[1]);
};

const expected = () => [...ACCEPTED_REVIEWER_LOGINS].sort(byName);

describe('the doc’s copies of the accepted-reviewer set', () => {
  it('both copies are still shaped the way the extractors expect', () => {
    const markdown = readRepoFile(DOC);
    expect(diagnosticFilters(markdown).length).toBeGreaterThan(0);
    expect(loginsInTable(markdown)).toBeDefined();
  });

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
