/**
 * The verdict documents the agent-review tests are written against.
 *
 * Extracted so the schema tests and the §2.4 flow tests share **one** definition
 * of what a valid document looks like. Two copies would let a fix land against a
 * fixture that no longer resembles the other, which is the failure the size
 * ceiling in `.claude/rules/scripts.md` is trying to force out into the open.
 *
 * Every document here is valid unless a test overrides a field to break it, so a
 * test names the one thing it is about. Both SHAs are synthetic — the contract
 * makes a fabricated citation `error`-grade (§7.11), and a fixture teaching the
 * format should not model one.
 *
 * Governed by .claude/rules/scripts.md.
 */

export const HEAD = 'a'.repeat(40);
export const OTHER = 'b'.repeat(40);
export const PR = 42;

/** One file, whose only added line in the new file is line 2. */
export const FILES = [
  {
    changes: 2,
    filename: 'src/a.ts',
    patch: '@@ -1,2 +1,3 @@\n one\n+two added\n two',
  },
];

export const CRITERION = {
  criterion: 'The check runs on every pull request without being invoked',
  falsifier:
    'Opened a pull request with no verdict; the check reported absent.',
  id: '1',
  method: 'observed on PR #727',
  outcome: 'met',
};

export const BLOCKING_FINDING = {
  failure_scenario:
    'A verdict for an earlier commit is accepted, so the merge bar reports a review of code nobody looked at.',
  file: 'src/a.ts',
  id: 'f1',
  kind: 'in-diff',
  line: 2,
  refutation:
    'Checked whether the caller compares the SHAs itself: it passes the document straight through.',
  severity: 'high',
  summary: 'The head SHA is never compared with the pull request head.',
};

export const passDocument = (overrides = {}) => ({
  criteria: [CRITERION],
  findings: [],
  head_sha: HEAD,
  pr: PR,
  reviewed_at: '2026-08-15T09:00:00Z',
  schema: 'agent-review-verdict/v1',
  verdict: 'pass',
  ...overrides,
});

export const failDocument = (overrides = {}) =>
  passDocument({
    criteria: [{ ...CRITERION, outcome: 'not-met' }],
    findings: [BLOCKING_FINDING],
    verdict: 'fail',
    ...overrides,
  });

/** A document rendered in §2.6's transport shape. */
export const verdictBody = (document, sha = HEAD) =>
  `Agent-review verdict: ${sha}\n\n\`\`\`json\n${JSON.stringify(document, null, 2)}\n\`\`\`\n`;
