import { describe, expect, it } from 'vite-plus/test';

import { qualityBaselinesQuery } from './qualityBaselinesQuery.util.ts';

const publicColumns = new Set([
  'eval_baseline.baseline_id',
  'eval_baseline.computed_at',
  'eval_baseline.id',
  'eval_baseline.metric',
  'eval_baseline.model_id',
  'eval_baseline.subject_id',
  'eval_baseline.suite',
  'eval_run.baseline_id',
  'eval_run.run_id',
  'eval_run.started_at',
  'eval_run.suite',
  'eval_subject.id',
  'eval_subject.kind',
  'eval_subject.name',
]);

describe('qualityBaselinesQuery', () => {
  const { text, values } = qualityBaselinesQuery({ publicColumns });

  it("takes each skill's latest quality baseline with the runs it was built from", () => {
    expect(values).toEqual([]);
    expect(text).toContain('select distinct on (baseline.subject_id)');
    expect(text).toContain("and baseline.metric = 'quality_overall'");
    expect(text).toContain(
      'order by baseline.subject_id, baseline.computed_at desc, baseline.id desc',
    );
    expect(text).toContain('on run.baseline_id = latest.baseline_id');
  });
});
