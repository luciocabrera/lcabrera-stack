import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { canonicalHash } from '@repo/eval-history/hashing/canonicalHash.util';
import { describe, expect, it } from 'vite-plus/test';

import {
  finishedSession,
  STARTED_AT,
  testIdentity,
  testPlan,
} from '../envelope-test-support.mjs';
import { assembleEnvelope } from '../run-envelope.mjs';

import {
  agentPromptHash,
  fixtureTask,
  tooledTrial,
  verdictLabel,
  verifierSubject,
  verifierTrial,
} from './verifier-envelope.mjs';
import { readTooledRun, tooledRunCounts } from './tooled-fixtures.mjs';

const task = (suite) =>
  fixtureTask({
    agentPromptHash: agentPromptHash({
      files: [{ bytes: 'contract', path: 'contract.md' }],
      systemPrompt: 'You verify.',
    }),
    diff: '+a\n',
    expectedNotMet: [2],
    fixture: 'missing-test',
    issue: '## 6. Acceptance Criteria\n',
    suite,
  });

const run = { notMet: [2], proof: true, verdict: 'FAIL — criterion 2' };

const envelopeFor = ({ suite, trials }) =>
  assembleEnvelope({
    finishedAt: STARTED_AT + 5000,
    identity: testIdentity,
    plan: testPlan({
      subjects: [verifierSubject('---\nname: refactor-verifier\n---\nBody\n')],
      suite,
      tasks: [task(suite)],
    }),
    status: 'complete',
    trials,
  });

describe('verdictLabel', () => {
  it('reduces a verdict line to PASS, FAIL or nothing', () => {
    expect(verdictLabel('PASS')).toBe('PASS');
    expect(verdictLabel('FAIL — 2 not met')).toBe('FAIL');
    expect(verdictLabel('UNSURE')).toBeNull();
    expect(verdictLabel(undefined)).toBeNull();
  });
});

describe('fixtureTask', () => {
  it('hashes the fixture expectation alone', () => {
    expect(task('verifier-fixtures')).toMatchObject({
      expected_hash: canonicalHash([2]),
      kind: 'fixture',
      task_key: 'verifier-fixtures/missing-test',
    });
  });
});

describe('verifier envelopes', () => {
  it('records a no-tools session and passes the schema', () => {
    const trial = verifierTrial({
      error: undefined,
      expectedNotMet: [2],
      fixture: 'missing-test',
      matched: true,
      metrics: finishedSession(),
      queuedAt: STARTED_AT,
      run,
      transcript: null,
      trialIndex: 1,
    });
    expect(trial).toMatchObject({
      detail: {
        expected_not_met: [2],
        matched: true,
        not_met: [2],
        schema: 'verifier/1',
        verdict: 'FAIL',
      },
      outcome: 'pass',
      trial_index: 1,
    });
    expect(
      parseEnvelope(
        envelopeFor({ suite: 'verifier-fixtures', trials: [trial] }),
      ).ok,
    ).toBe(true);
  });

  it('records a tooled setup failure as an error, not a fail', () => {
    const trial = tooledTrial({
      expectedNotMet: [2],
      fixture: 'missing-test',
      matched: false,
      metrics: undefined,
      queuedAt: STARTED_AT,
      run: readTooledRun({ error: 'setup failed: no worktree', report: '' }),
      setupFailed: true,
      transcript: null,
      trialIndex: 0,
    });
    expect(trial).toMatchObject({
      detail: {
        gate_proof_seen: false,
        schema: 'verifier-tooled/1',
        verdict: null,
      },
      error_class: 'setup',
      outcome: 'error',
    });
    expect(
      parseEnvelope(envelopeFor({ suite: 'verifier-tooled', trials: [trial] }))
        .ok,
    ).toBe(true);
  });

  it('records a run that changed its worktree as an error, not a fail', () => {
    const report = [
      'VERDICT: FAIL',
      '',
      '| # | Criterion | Outcome | Method | Falsifier |',
      '|---|---|---|---|---|',
      '| 2 | a | not-met | ran it | x |',
      '',
      'Failed: vp run test exit 1',
      'Passed: vp run test exit 0',
    ].join('\n');
    const dirtyRun = readTooledRun({
      report,
      treeProblem: 'the worktree was left dirty: M a.ts',
    });
    expect(
      tooledTrial({
        expectedNotMet: [2],
        fixture: 'missing-test',
        matched: tooledRunCounts({ expectedNotMet: [2], run: dirtyRun }),
        metrics: finishedSession(),
        queuedAt: STARTED_AT,
        run: dirtyRun,
        setupFailed: false,
        transcript: null,
        trialIndex: 0,
      }),
    ).toMatchObject({
      detail: { gate_proof_seen: true, not_met: [2], verdict: 'FAIL' },
      error_class: 'harness',
      outcome: 'error',
    });
  });
});
