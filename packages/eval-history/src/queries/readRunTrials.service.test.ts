import { describe, expect, it } from 'vite-plus/test';

import type { SqlQuery } from './queries.types.ts';

import { readRunTrials } from './readRunTrials.service.ts';
import { scriptedClient } from './scriptedClient.util.ts';

const COLUMNS = [
  'eval_subject.id',
  'eval_subject.kind',
  'eval_subject.name',
  'eval_subject_version.id',
  'eval_subject_version.subject_id',
  'eval_task.id',
  'eval_task.kind',
  'eval_task.task_key',
  'eval_task.task_set',
  'eval_task_version.id',
  'eval_task_version.task_id',
  'eval_trial.cost_usd_reported',
  'eval_trial.duration_ms',
  'eval_trial.error_class',
  'eval_trial.id',
  'eval_trial.outcome',
  'eval_trial.run_id',
  'eval_trial.subject_version_id',
  'eval_trial.task_version_id',
  'eval_trial.tokens_in',
  'eval_trial.tokens_out',
  'eval_trial.trial_index',
  'eval_trial.turns',
  'eval_trial_detail.trial_id',
].map((qualified) => {
  const [table = '', column = ''] = qualified.split('.', 2);

  return { column, dataType: 'integer', table, udtName: 'int4' };
});

const trial = {
  costUsd: 0.02,
  durationMs: 1200,
  errorClass: 'timeout_exceeded',
  expectedSkill: 'react-19',
  invoked: ['react-19'],
  outcome: 'pass',
  overall: 4,
  subjectKind: 'skill',
  subjectName: 'react-19',
  taskKey: 'skills/react-19/trigger-1',
  taskKind: 'trigger',
  taskSet: 'regression',
  tokensIn: 2000,
  tokensOut: 300,
  trialId: '41',
  trialIndex: 0,
  turns: 3,
  verdict: 'PASS',
};

const args = {
  limit: 10,
  offset: 0,
  runId: '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50',
  sorting: [],
};

const answerWith =
  (page: readonly unknown[]) =>
  ({ text }: SqlQuery) => {
    const isCount = text.startsWith('select count(*)');

    return isCount ? [{ total: 12 }] : page;
  };

describe('readRunTrials', () => {
  it('returns a page of trials with the total for the run', async () => {
    const { client } = scriptedClient({
      answer: answerWith([trial]),
      columns: COLUMNS,
    });

    expect(await readRunTrials({ client, ...args })).toEqual({
      data: [trial],
      total: 12,
    });
  });

  it('rejects a trial row whose outcome is unknown', async () => {
    const { client } = scriptedClient({
      answer: answerWith([{ ...trial, outcome: 'maybe' }]),
      columns: COLUMNS,
    });

    await expect(readRunTrials({ client, ...args })).rejects.toThrow();
  });
});
