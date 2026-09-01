import { describe, expect, it } from 'vite-plus/test';

import {
  commentProse,
  declaredNames,
  readRepoFile,
  singleQuotedConst,
  stepBlock,
} from './workflow-inspect.mjs';

const RECONCILE = '.github/workflows/review-gate-reconcile.yml';
const COPILOT_GATE = '.github/workflows/copilot-review-gate.yml';
const AGENT_GATE = '.github/workflows/agent-review-verdict.yml';

const COPILOT_LIB = 'scripts/lib/copilot-review.mjs';
const AGENT_SCRIPT = 'scripts/verify-agent-review.mjs';

const SWEEP_STEP = 'Reconcile every open pull request';
const TRACKING_ISSUE_STEP = 'File or update the tracking issue';
const FAIL_RUN_STEP = 'Fail the run when the sweep did';

const statusContexts = () => {
  const contexts = [
    singleQuotedConst(readRepoFile(COPILOT_LIB), 'STATUS_CONTEXT'),
    singleQuotedConst(readRepoFile(AGENT_SCRIPT), 'STATUS_CONTEXT'),
  ];
  expect(
    contexts,
    'a STATUS_CONTEXT declaration moved — re-anchor this test on its new home',
  ).toEqual(['Copilot review complete', 'Agent review verdict']);
  return contexts;
};

describe('the reconcile workflow — that it runs on its own', () => {
  it('declares a schedule, which is the whole point of the file', () => {
    expect(readRepoFile(RECONCILE)).toMatch(/^\s*schedule:\s*$/m);
  });

  it('runs on the recorded half-hourly cron, offset off the hour', () => {
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
    const names = declaredNames(readRepoFile(RECONCILE));
    expect(names.length).toBeGreaterThan(1);
    for (const context of statusContexts()) {
      expect(names).not.toContain(context);
    }
  });

  it('cancels no run that would publish a status', () => {
    expect(readRepoFile(RECONCILE)).not.toMatch(
      /cancel-in-progress:[ \t]*true/,
    );
    expect(readRepoFile(RECONCILE)).toMatch(/cancel-in-progress:[ \t]*false/);
  });

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
      expect(source).toMatch(/inputs\.pr/);
    });
  }
});
