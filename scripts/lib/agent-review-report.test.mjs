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
