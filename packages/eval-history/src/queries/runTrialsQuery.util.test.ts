import { describe, expect, it } from 'vite-plus/test';

import { runTrialsQuery } from './runTrialsQuery.util.ts';

const publicColumns = new Set([
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
]);

const base = {
  limit: 50,
  offset: 100,
  publicColumns,
  runId: 'run-a',
  sorting: [],
};

describe('runTrialsQuery', () => {
  it('pages one run and counts it with the same filter', () => {
    const { count, page } = runTrialsQuery(base);

    expect(page.values).toEqual(['run-a', 50, 100]);
    expect(page.text).toContain('limit $2 offset $3');
    expect(count.values).toEqual(['run-a']);
    expect(count.text).toContain('where trial.run_id = $1');
  });

  it('narrows to one trial when asked', () => {
    const { count, page } = runTrialsQuery({ ...base, trialId: '7' });

    expect(page.values).toEqual(['run-a', '7', 50, 100]);
    expect(page.text).toContain('and trial.id = $2');
    expect(page.text).toContain('limit $3 offset $4');
    expect(count.values).toEqual(['run-a', '7']);
  });

  it('orders by a known column and ignores an unknown one', () => {
    const { page } = runTrialsQuery({
      ...base,
      sorting: [
        { column: 'durationMs', direction: 'desc' },
        { column: 'transcript_uri', direction: 'asc' },
      ],
    });

    expect(page.text).toContain(
      'order by trial.duration_ms desc nulls last, task.task_key, trial.trial_index, trial.id',
    );
    expect(page.text).not.toContain('transcript_uri');
  });

  it('reads the detail only through its allowed fields', () => {
    const { page } = runTrialsQuery(base);

    expect(page.text).toContain("detail -> 'verdict' as detail_verdict");
    expect(page.text).not.toMatch(/select[^()]*\bdetail\s*(?:,|from)/u);
  });
});
