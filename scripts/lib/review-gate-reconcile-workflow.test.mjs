import { describe, expect, it } from 'vite-plus/test';

import {
  commentProse,
  declaredNames,
  readRepoFile,
  singleQuotedConst,
} from './workflow-inspect.mjs';

// What this file holds in place is a workflow that is easy to break by tidying:
// the schedule that makes the reconcile exist at all, the reason it is not the
// polling `copilot-review-gate.yml` rejects, and the two absences the review
// gates already depend on (no job named after a status context, no cancelling
// concurrency group).
//
// The strings are read from the files that define them, so renaming either side
// is what fails here rather than a stale copy quietly agreeing with itself.

const RECONCILE = '.github/workflows/review-gate-reconcile.yml';
const COPILOT_GATE = '.github/workflows/copilot-review-gate.yml';
const AGENT_GATE = '.github/workflows/agent-review-verdict.yml';

const COPILOT_LIB = 'scripts/lib/copilot-review.mjs';
const AGENT_SCRIPT = 'scripts/verify-agent-review.mjs';

/** Both status contexts, from their one definition apiece. */
const statusContexts = () => {
  const contexts = [
    singleQuotedConst(readRepoFile(COPILOT_LIB), 'STATUS_CONTEXT'),
    singleQuotedConst(readRepoFile(AGENT_SCRIPT), 'STATUS_CONTEXT'),
  ];
  // Asserted rather than defaulted: an undefined context would satisfy the
  // "no job is named this" check while checking nothing at all.
  expect(
    contexts,
    'a STATUS_CONTEXT declaration moved — re-anchor this test on its new home',
  ).toEqual(['Copilot review complete', 'Agent review verdict']);
  return contexts;
};

describe('the reconcile workflow — that it runs on its own', () => {
  it('declares a schedule, which is the whole point of the file', () => {
    // Without this the sweep is only a script nobody invokes, and both gates go
    // back to depending on an event that is not delivered (#737).
    expect(readRepoFile(RECONCILE)).toMatch(/^\s*schedule:\s*$/m);
  });

  it('runs on the recorded half-hourly cron, offset off the hour', () => {
    // The offset is deliberate — the top of the hour is where scheduled runs
    // queue longest — so it is pinned rather than left to the next edit.
    expect(readRepoFile(RECONCILE)).toMatch(/-\s*cron:\s*'7,37 \* \* \* \*'/);
  });

  it('records why that interval, so the next reader does not have to guess', () => {
    expect(commentProse(readRepoFile(RECONCILE))).toMatch(
      /THE INTERVAL IS A DECISION/,
    );
  });

  it('takes a dispatch too, so break-glass has something to press', () => {
    expect(readRepoFile(RECONCILE)).toMatch(/^\s*workflow_dispatch:\s*$/m);
  });
});

describe('the reconcile workflow — that it does not contradict the gates', () => {
  it('answers the polling rejection rather than quietly overriding it', () => {
    // `copilot-review-gate.yml` rules out a job that sleeps. A schedule added
    // under that sentence without a word about it would leave the repository
    // holding two opposite positions, which is worse than either.
    const prose = commentProse(readRepoFile(RECONCILE));
    expect(prose).toMatch(/NOT THE POLLING/i);
    expect(prose).toMatch(/copilot-review-gate\.yml/);
  });

  it('is pointed at from the gate whose reasoning it extends', () => {
    expect(commentProse(readRepoFile(COPILOT_GATE))).toMatch(
      /review-gate-reconcile\.yml/,
    );
  });

  it('names no job after either status context', () => {
    // A job's check run and a commit status share one namespace on a pull
    // request, so a job named after a context would publish a second row under
    // it — green because the sweep ran. #698 promotes those contexts.
    const names = declaredNames(readRepoFile(RECONCILE));
    expect(names.length).toBeGreaterThan(1);
    for (const context of statusContexts()) {
      expect(names).not.toContain(context);
    }
  });

  it('cancels no run that would publish a status', () => {
    // The hazard is cancellation, not grouping: this one groups so two sweeps
    // do not overlap, and queues rather than cancels for the same reason both
    // gates carry no group at all.
    expect(readRepoFile(RECONCILE)).not.toMatch(
      /cancel-in-progress:[ \t]*true/,
    );
    expect(readRepoFile(RECONCILE)).toMatch(/cancel-in-progress:[ \t]*false/);
  });

  it('fails loudly, because a silent sweep is indistinguishable from a healthy one', () => {
    const source = readRepoFile(RECONCILE);
    expect(source).toMatch(/steps\.sweep\.outcome == 'failure'/);
    expect(source).toMatch(/issues\.create/);
  });
});

describe('both gates — the break-glass dispatch', () => {
  for (const gate of [COPILOT_GATE, AGENT_GATE]) {
    it(`${gate} accepts a pull request number by dispatch`, () => {
      const source = readRepoFile(gate);
      expect(source).toMatch(/^\s*workflow_dispatch:\s*$/m);
      // The input has to reach the script, not merely exist: an unused input is
      // a button that runs the workflow against nothing.
      expect(source).toMatch(/inputs\.pr/);
    });
  }
});
