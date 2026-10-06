import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { describe, expect, it } from 'vite-plus/test';

import {
  STARTED_AT,
  testIdentity,
  testPlan,
} from '../envelope-test-support.mjs';
import { assembleEnvelope } from '../run-envelope.mjs';

import { rulesRecords } from './rules-envelope.mjs';

const TYPESCRIPT = '.claude/rules/typescript.md';
const TESTING = '.claude/rules/testing.md';
const GONE = '.claude/rules/gone.md';

const records = rulesRecords({
  coverageFindings: [`${TESTING} matches no tracked file, so it never loads`],
  finishedAt: STARTED_AT + 40,
  indexed: [TYPESCRIPT, GONE],
  indexFindings: [
    `${TESTING} is not listed in the AGENTS.md rules index`,
    `AGENTS.md indexes ${GONE}, which does not exist`,
  ],
  rules: [
    { globs: ['**/*.ts'], label: TYPESCRIPT, source: '# TypeScript\n' },
    { globs: ['**/*.test.*'], label: TESTING, source: '# Testing\n' },
  ],
  shared: [{ first: TYPESCRIPT, second: TESTING, shared: ['a.test.ts'] }],
  startedAt: STARTED_AT,
});

const trialOf = (taskKey) =>
  records.trials.find(({ task_key }) => task_key === taskKey);

describe('rulesRecords', () => {
  it('records each check of each rule as one trial holding its findings', () => {
    expect(records.trials.map(({ task_key }) => task_key)).toStrictEqual([
      'rules-consistency/typescript/indexed',
      'rules-consistency/typescript/covered',
      'rules-consistency/typescript/overlap',
      'rules-consistency/testing/indexed',
      'rules-consistency/testing/covered',
      'rules-consistency/testing/overlap',
      'rules-consistency/gone/indexed',
    ]);
    expect(trialOf('rules-consistency/testing/covered')).toMatchObject({
      detail: {
        check: 'covered',
        findings: [`${TESTING} matches no tracked file, so it never loads`],
        schema: 'rules/1',
      },
      outcome: 'fail',
    });
    expect(trialOf('rules-consistency/typescript/indexed').outcome).toBe(
      'pass',
    );
    expect(trialOf('rules-consistency/gone/indexed').outcome).toBe('fail');
  });

  it('prints an overlap as a finding without failing it', () => {
    expect(trialOf('rules-consistency/typescript/overlap')).toMatchObject({
      detail: { findings: [`loads with ${TESTING} on 1 file(s)`] },
      outcome: 'pass',
    });
  });

  it('builds an envelope the schema accepts, at zero cost', () => {
    const envelope = assembleEnvelope({
      finishedAt: STARTED_AT + 50,
      identity: testIdentity,
      plan: testPlan({
        modelId: undefined,
        sdkVersion: undefined,
        subjects: records.subjects,
        suite: 'rules-consistency',
        tasks: records.tasks,
      }),
      status: 'complete',
      trials: records.trials,
    });
    expect(parseEnvelope(envelope).ok).toBe(true);
    expect(envelope.run).toMatchObject({
      model_id: null,
      totals: {
        cost_usd_reported: 0,
        tokens: { cache_read: 0, cache_write: 0, input: 0, output: 0 },
      },
    });
    expect(
      envelope.trials.every(({ cost_usd_reported }) => cost_usd_reported === 0),
    ).toBe(true);
  });
});
