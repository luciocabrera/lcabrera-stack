import { describe, expect, it } from 'vite-plus/test';

import {
  validatePullRequestVerdict,
  validateVerdictBody,
} from './agent-review-validate.mjs';

const HEAD = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);
const PR = 42;

/** One file, whose only added line in the new file is line 2. */
const FILES = [
  {
    changes: 2,
    filename: 'src/a.ts',
    patch: '@@ -1,2 +1,3 @@\n one\n+two added\n two',
  },
];

const CRITERION = {
  criterion: 'The check runs on every pull request without being invoked',
  falsifier:
    'Opened a pull request with no verdict; the check reported absent.',
  id: '1',
  method: 'observed on PR #727',
  outcome: 'met',
};

const BLOCKING_FINDING = {
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

const passDocument = (overrides = {}) => ({
  criteria: [CRITERION],
  findings: [],
  head_sha: HEAD,
  pr: PR,
  reviewed_at: '2026-08-15T09:00:00Z',
  schema: 'agent-review-verdict/v1',
  verdict: 'pass',
  ...overrides,
});

const failDocument = (overrides = {}) =>
  passDocument({
    criteria: [{ ...CRITERION, outcome: 'not-met' }],
    findings: [BLOCKING_FINDING],
    verdict: 'fail',
    ...overrides,
  });

const body = (document, sha = HEAD) =>
  `Agent-review verdict: ${sha}\n\n\`\`\`json\n${JSON.stringify(document, null, 2)}\n\`\`\`\n`;

const validate = (document, options = {}) =>
  validateVerdictBody(body(document), {
    files: FILES,
    headSha: HEAD,
    pr: PR,
    ...options,
  });

describe('validateVerdictBody — the happy paths', () => {
  it('accepts an evidence-bearing pass', () => {
    const result = validate(passDocument());
    expect(result.state).toBe('pass');
    expect(result.errors).toEqual([]);
  });

  it('accepts a fail whose blocking finding is admissible', () => {
    const result = validate(failDocument());
    expect(result.state).toBe('fail');
    expect(result.blocking).toEqual(['f1']);
  });

  it('accepts an error verdict that says why', () => {
    const result = validate(
      passDocument({
        criteria: undefined,
        error_reason: 'The diff exceeded the reviewer input budget.',
        verdict: 'error',
      }),
    );
    expect(result.state).toBe('error');
    // An error verdict is the reviewer's own conclusion, not a validation
    // failure — nothing is wrong with the document.
    expect(result.errors).toEqual([]);
  });

  it('carries the reviewer reason out, so the report can say why', () => {
    // Without this the two kinds of `error` — the reviewer could not conclude
    // (§2.3), and the document is not usable (§2.4) — are indistinguishable
    // downstream, and the report has to guess which one it is holding.
    const result = validate(
      passDocument({
        criteria: undefined,
        error_reason: 'The diff exceeded the reviewer input budget.',
        verdict: 'error',
      }),
    );
    expect(result.errorReason).toBe(
      'The diff exceeded the reviewer input budget.',
    );
  });

  it('leaves the reviewer reason unset on a verdict it rejected', () => {
    expect(
      validate(passDocument({ criteria: undefined })).errorReason,
    ).toBeUndefined();
  });

  it('accepts an omission finding anchored by a rule instead of a line', () => {
    const result = validate(
      failDocument({
        findings: [
          {
            ...BLOCKING_FINDING,
            file: 'docs/agents/agent-review-contract.md',
            kind: 'omission',
            line: null,
            rule: 'AGENTS.md §5 Rule 11',
          },
        ],
      }),
    );
    expect(result.state).toBe('fail');
  });
});

describe('validateVerdictBody — §2.4 step 1, parse', () => {
  it('reports error for an unparseable verdict', () => {
    const result = validateVerdictBody(
      `Agent-review verdict: ${HEAD}\n\n\`\`\`json\n{"verdict": "pass"\n\`\`\`\n`,
      { files: FILES, headSha: HEAD, pr: PR },
    );
    expect(result.state).toBe('error');
  });

  it('reports error for a verdict truncated before its fence closes', () => {
    const result = validateVerdictBody(
      `Agent-review verdict: ${HEAD}\n\n\`\`\`json\n${JSON.stringify(passDocument())}`,
      { files: FILES, headSha: HEAD, pr: PR },
    );
    expect(result.state).toBe('error');
  });

  it('reports error for prose where the document should be', () => {
    const result = validateVerdictBody(
      `Agent-review verdict: ${HEAD}\n\nLooks good to me.`,
      { files: FILES, headSha: HEAD, pr: PR },
    );
    expect(result.state).toBe('error');
  });
});

describe('validateVerdictBody — §2.4 steps 2 and 3, schema', () => {
  it('reports error for an unknown schema version', () => {
    const result = validate(
      passDocument({ schema: 'agent-review-verdict/v2' }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('`schema`');
  });

  it('reports error for a missing required field', () => {
    const result = validate(passDocument({ reviewed_at: undefined }));
    expect(result.state).toBe('error');
  });

  it('reports error for an unknown field rather than ignoring it', () => {
    const result = validate(passDocument({ approved_by: 'me' }));
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('approved_by');
  });

  it('reports error for a findings field that is not an array', () => {
    expect(validate(passDocument({ findings: 'none' })).state).toBe('error');
  });
});

describe('validateVerdictBody — §2.5, the head binding', () => {
  it('reports error when the document names another commit', () => {
    const result = validate(passDocument({ head_sha: OTHER }));
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('§2.5');
  });

  it('reports error when the document names another pull request', () => {
    const result = validate(passDocument({ pr: PR + 1 }));
    expect(result.state).toBe('error');
  });
});

describe('validateVerdictBody — §2.4 step 5, admissibility', () => {
  it('reports error for a blocking finding with no refutation', () => {
    const result = validate(
      failDocument({
        findings: [{ ...BLOCKING_FINDING, refutation: undefined }],
      }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('refutation');
  });

  it('reports error for an in-diff finding on a line the diff did not add', () => {
    const result = validate(
      failDocument({ findings: [{ ...BLOCKING_FINDING, line: 3 }] }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('not a line this diff added');
  });

  it('reports error for an in-diff finding on a file the diff did not touch', () => {
    const result = validate(
      failDocument({
        findings: [{ ...BLOCKING_FINDING, file: 'src/never.ts' }],
      }),
    );
    expect(result.state).toBe('error');
  });

  it('reports error for an omission that still carries a line', () => {
    const result = validate(
      failDocument({
        findings: [
          { ...BLOCKING_FINDING, kind: 'omission', rule: 'AGENTS.md §5' },
        ],
      }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('not null');
  });

  it('reports error for an omission citing no rule', () => {
    const result = validate(
      failDocument({
        findings: [{ ...BLOCKING_FINDING, kind: 'omission', line: null }],
      }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('rule');
  });

  it('reports error when the cited file has no patch to check against', () => {
    const result = validateVerdictBody(body(failDocument()), {
      files: [{ changes: 9000, filename: 'src/a.ts' }],
      headSha: HEAD,
      pr: PR,
    });
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('cannot be checked');
  });
});

describe('validateVerdictBody — §2.4 step 6, and never repairing', () => {
  it('reports error, not fail, for a pass carrying an admissible blocking finding', () => {
    // Recomputing the verdict here is exactly what §2.4 forbids: a validator
    // that edits findings is a second reviewer with no contract.
    const result = validate(
      passDocument({ findings: [BLOCKING_FINDING], verdict: 'pass' }),
    );
    expect(result.state).toBe('error');
    expect(result.state).not.toBe('fail');
    expect(result.errors[0]).toContain('§2.4 step 6');
  });

  it('reports error for a fail with nothing blocking to show for it', () => {
    const result = validate(
      failDocument({
        findings: [
          { ...BLOCKING_FINDING, refutation: undefined, severity: 'low' },
        ],
      }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('no admissible blocking finding');
  });

  it('keeps a non-blocking finding on a pass', () => {
    const result = validate(
      passDocument({
        findings: [
          { ...BLOCKING_FINDING, refutation: undefined, severity: 'medium' },
        ],
      }),
    );
    expect(result.state).toBe('pass');
  });

  it('reports error for a pass whose own criteria table says not-met', () => {
    const result = validate(
      passDocument({ criteria: [{ ...CRITERION, outcome: 'not-met' }] }),
    );
    expect(result.state).toBe('error');
  });
});

describe('validateVerdictBody — the evidence a pass must carry', () => {
  it('reports error for a pass with no criteria at all', () => {
    const result = validate(passDocument({ criteria: undefined }));
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('criteria');
  });

  it('reports error for a pass whose criteria list is empty', () => {
    expect(validate(passDocument({ criteria: [] })).state).toBe('error');
  });

  it('reports error for a criterion with no falsifier', () => {
    // The falsifier is the whole point: without it a pass costs nothing to
    // forge, which is the asymmetry §5 of issue #697 removes.
    const result = validate(
      passDocument({ criteria: [{ ...CRITERION, falsifier: '   ' }] }),
    );
    expect(result.state).toBe('error');
    expect(result.errors[0]).toContain('falsifier');
  });

  it('reports error for a criterion missing its method', () => {
    expect(
      validate(
        passDocument({ criteria: [{ ...CRITERION, method: undefined }] }),
      ).state,
    ).toBe('error');
  });
});

describe('validatePullRequestVerdict', () => {
  const comment = (text) => ({
    body: text,
    html_url: 'https://example.test/1',
  });

  it('reports absent when nothing was posted', () => {
    const result = validatePullRequestVerdict({
      comments: [comment('nice work')],
      files: FILES,
      headSha: HEAD,
      pr: PR,
    });
    expect(result.state).toBe('absent');
    expect(result.reason).toContain('no verdict');
  });

  it('reports absent — not pass — once the head moves past the verdict', () => {
    // The stale probe: the same document that passed for OTHER answers for
    // nothing once HEAD is the head.
    const posted = comment(body(passDocument({ head_sha: OTHER }), OTHER));
    expect(
      validatePullRequestVerdict({
        comments: [posted],
        files: FILES,
        headSha: OTHER,
        pr: PR,
      }).state,
    ).toBe('pass');
    const afterPush = validatePullRequestVerdict({
      comments: [posted],
      files: FILES,
      headSha: HEAD,
      pr: PR,
    });
    expect(afterPush.state).toBe('absent');
    expect(afterPush.reason).toContain('§2.5');
  });

  it('reports error when two verdicts name the same head', () => {
    const result = validatePullRequestVerdict({
      comments: [comment(body(failDocument())), comment(body(passDocument()))],
      files: FILES,
      headSha: HEAD,
      pr: PR,
    });
    expect(result.state).toBe('error');
    expect(result.state).not.toBe('pass');
  });

  it('carries the verdict comment link through', () => {
    const result = validatePullRequestVerdict({
      comments: [comment(body(passDocument()))],
      files: FILES,
      headSha: HEAD,
      pr: PR,
    });
    expect(result.commentUrl).toBe('https://example.test/1');
  });
});
