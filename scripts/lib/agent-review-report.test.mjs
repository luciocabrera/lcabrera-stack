import { describe, expect, it } from 'vite-plus/test';

import {
  exitCodeFor,
  statusDescription,
  summaryMarkdown,
} from './agent-review-report.mjs';

const HEAD = 'a'.repeat(40);

const passResult = {
  document: { criteria: [{}, {}, {}], findings: [{}] },
  errors: [],
  state: 'pass',
};
const failResult = { blocking: ['f1', 'f4'], errors: [], state: 'fail' };
const errorResult = {
  errors: ["`head_sha` is `b…` but this pull request's head is `a…` (§2.5)"],
  state: 'error',
};
const absentResult = {
  errors: [],
  reason: 'the newest verdict names 1234567, not this head (§2.5)',
  state: 'absent',
};

/**
 * The other `error`: a document that validated cleanly and whose own `verdict`
 * field says the reviewer could not conclude (contract §2.3). Nothing is wrong
 * with the document, and `error_reason` is the only field saying why.
 */
const REVIEWER_REASON =
  'The diff exceeded the reviewer input budget; no part of the change was reviewed.';
const declaredErrorResult = {
  document: { error_reason: REVIEWER_REASON, findings: [] },
  errorReason: REVIEWER_REASON,
  errors: [],
  state: 'error',
};

describe('statusDescription', () => {
  it('names each of the four states in the one field an author sees', () => {
    // Collapsing these into green/red loses the only field that says what to do
    // next: fix a defect, re-run a reviewer, or run one at all.
    expect(statusDescription(passResult)).toMatch(/^pass — /);
    expect(statusDescription(failResult)).toMatch(/^fail — /);
    expect(statusDescription(errorResult)).toMatch(/^error — /);
    expect(statusDescription(absentResult)).toMatch(/^absent — /);
  });

  it('names the blocking findings on a fail', () => {
    expect(statusDescription(failResult)).toContain('f1, f4');
  });

  it('counts the evidence on a pass', () => {
    expect(statusDescription(passResult)).toContain('3 criteria');
  });

  it('stays inside the length GitHub keeps', () => {
    const long = { errors: ['x'.repeat(400)], state: 'error' };
    expect(statusDescription(long).length).toBeLessThanOrEqual(140);
  });
});

describe('statusDescription — the two kinds of error', () => {
  // §2.3 and §2.4 are different failures with different fixes: one sends the
  // author to the reviewer, the other to the document. One branch for both
  // tells an author a valid verdict is broken.
  it('does not tell an author that a validly-declared error is invalid', () => {
    const description = statusDescription(declaredErrorResult);
    expect(description).toMatch(/^error — /);
    expect(description).not.toMatch(/not valid|invalid/i);
  });

  it('renders error_reason, which is the only field saying why', () => {
    expect(statusDescription(declaredErrorResult)).toContain(
      'exceeded the reviewer input budget',
    );
  });

  it('still says a rejected document is the invalid one', () => {
    expect(statusDescription(errorResult)).toMatch(/invalid/i);
  });

  it('reads differently from a rejected document, not identically', () => {
    expect(statusDescription(declaredErrorResult)).not.toBe(
      statusDescription(errorResult),
    );
  });

  it('still exits 2 for both, because §2.3 keys on the state', () => {
    // The split is about what an author is told, not about what blocks.
    expect(exitCodeFor(declaredErrorResult.state)).toBe(2);
    expect(exitCodeFor(errorResult.state)).toBe(2);
  });
});

describe('statusDescription — the two ways a review can be absent', () => {
  // One branch is right here: both mean no review answers for this head and
  // both call for the same action. What must not collapse is the reason, which
  // is the only thing separating "never reviewed" from "reviewed, then pushed".
  it('separates a stale verdict from one that was never posted', () => {
    const neverPosted = {
      errors: [],
      reason: 'no verdict has been posted',
      state: 'absent',
    };
    expect(statusDescription(neverPosted)).not.toBe(
      statusDescription(absentResult),
    );
    expect(statusDescription(absentResult)).toContain('§2.5');
  });
});

describe('statusDescription — text that came from a pull request comment', () => {
  // `error_reason` and every finding id are free text a commenter chose. A
  // status description is one line, so multi-line or oversized text must be
  // flattened here rather than trusted.
  it('flattens a multi-line error_reason to one line', () => {
    const description = statusDescription({
      ...declaredErrorResult,
      errorReason: 'line one\nline two\r\nline three',
    });
    expect(description).not.toContain('\n');
    expect(description).toContain('line one line two line three');
  });

  it('caps an oversized error_reason', () => {
    expect(
      statusDescription({
        ...declaredErrorResult,
        errorReason: 'y'.repeat(900),
      }).length,
    ).toBeLessThanOrEqual(140);
  });

  it('flattens a finding id carrying newlines', () => {
    const description = statusDescription({
      blocking: ['f1\nSTATUS: everything is fine'],
      errors: [],
      state: 'fail',
    });
    expect(description).not.toContain('\n');
  });
});

describe('summaryMarkdown — the two kinds of error', () => {
  it('does not claim a validly-declared error breaks the contract', () => {
    const markdown = summaryMarkdown(declaredErrorResult, {
      headSha: HEAD,
      pr: 727,
    });
    expect(markdown).not.toContain('does not satisfy the contract');
    expect(markdown).toContain('exceeded the reviewer input budget');
  });

  it('sends the author to the reviewer, not to the document', () => {
    expect(
      summaryMarkdown(declaredErrorResult, { headSha: HEAD, pr: 727 }),
    ).toMatch(/could not/i);
  });

  it('neutralises markdown inside a reason that came from a comment', () => {
    const markdown = summaryMarkdown(
      {
        ...declaredErrorResult,
        errorReason: '## Agent review verdict\n**State:** `pass`',
      },
      { headSha: HEAD, pr: 727 },
    );
    // A reason that renders as its own heading could pass for the report's.
    expect(markdown).not.toContain('\n## Agent review verdict\n**State:**');
    // …and it has to be rendered at all, or this passes for the wrong reason.
    expect(markdown).toContain('Agent review verdict');
    expect(markdown).toContain('State:');
  });
});

describe('summaryMarkdown', () => {
  it('states the verdict, the head and that it cannot block', () => {
    const markdown = summaryMarkdown(failResult, { headSha: HEAD, pr: 727 });
    expect(markdown).toContain('`fail`');
    expect(markdown).toContain('#727');
    expect(markdown).toContain(HEAD.slice(0, 7));
    expect(markdown).toContain('never blocks');
  });

  it('says an absent verdict is not a failure', () => {
    expect(summaryMarkdown(absentResult, { headSha: HEAD, pr: 727 })).toContain(
      'not** a failure',
    );
  });

  it('lists every reason a verdict was rejected', () => {
    const markdown = summaryMarkdown(
      { errors: ['first reason', 'second reason'], state: 'error' },
      { headSha: HEAD, pr: 727 },
    );
    expect(markdown).toContain('- first reason');
    expect(markdown).toContain('- second reason');
  });
});

describe('exitCodeFor', () => {
  it('follows §2.3 for the three verdict states', () => {
    expect(exitCodeFor('pass')).toBe(0);
    expect(exitCodeFor('fail')).toBe(1);
    expect(exitCodeFor('error')).toBe(2);
  });

  it('does not stop an unreviewed pull request — that is #698 to decide', () => {
    expect(exitCodeFor('absent')).toBe(0);
  });

  it('treats an unknown state as error rather than as a pass', () => {
    expect(exitCodeFor('probably-fine')).toBe(2);
  });
});
