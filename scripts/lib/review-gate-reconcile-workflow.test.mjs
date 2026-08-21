import { describe, expect, it } from 'vite-plus/test';

import {
  commentProse,
  declaredNames,
  readRepoFile,
  singleQuotedConst,
  stepBlock,
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

/**
 * The three steps of the reconcile job that are asserted individually.
 *
 * By name, because a name is the only thing in a step that belongs to it alone —
 * the `if:` condition the failure steps react to is shared, and anchoring on it
 * lets either step be deleted with the suite still green.
 */
const SWEEP_STEP = 'Reconcile every open pull request';
const TRACKING_ISSUE_STEP = 'File or update the tracking issue';
const FAIL_RUN_STEP = 'Fail the run when the sweep did';

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
    // it — green because the sweep ran. One of them is a required context.
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

  // "Fails loudly" is TWO mechanisms — it tells someone, and it fails the run —
  // and they are asserted separately because either one alone still looks fine.
  // Both steps carry `if: steps.sweep.outcome == 'failure'`, so an assertion
  // anchored on that condition is satisfied by whichever step survives: delete
  // the other and the suite stays green. Each test below anchors on the step
  // NAME, which appears only in the step it protects.
  it('tells someone when the sweep fails, rather than only going red', () => {
    const step = stepBlock(readRepoFile(RECONCILE), TRACKING_ISSUE_STEP);
    expect(
      step,
      `no step named "${TRACKING_ISSUE_STEP}" — a scheduled red X is wallpaper, so the failure has to reach a person`,
    ).toBeDefined();
    expect(step).toMatch(/steps\.sweep\.outcome == 'failure'/);
    expect(step).toMatch(/issues\.create/);
  });

  it('fails the run the sweep failed in, so the schedule is not green-on-failure', () => {
    const step = stepBlock(readRepoFile(RECONCILE), FAIL_RUN_STEP);
    expect(
      step,
      `no step named "${FAIL_RUN_STEP}" — the sweep step is continue-on-error, so without this the job reports success`,
    ).toBeDefined();
    expect(step).toMatch(/steps\.sweep\.outcome == 'failure'/);
    expect(step).toMatch(/exit 1/);
  });

  it('keeps the sweep step continue-on-error, which is why both of the above exist', () => {
    // If this ever stops being true the two steps above become dead weight, and
    // the reason they are separate stops being obvious.
    expect(stepBlock(readRepoFile(RECONCILE), SWEEP_STEP)).toMatch(
      /continue-on-error:[ \t]*true/,
    );
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
