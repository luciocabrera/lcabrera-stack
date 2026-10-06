import { describe, expect, it } from 'vite-plus/test';

import { excludedColumnsNamed } from './excludedColumnsNamed.util.ts';

describe('excludedColumnsNamed', () => {
  it('names an excluded column selected bare or qualified', () => {
    expect(
      excludedColumnsNamed(
        'select trial.transcript_uri, detail from evals.eval_trial trial',
      ),
    ).toEqual(['eval_trial.transcript_uri', 'eval_trial_detail.detail']);
  });

  it('ignores a column whose name only starts like an excluded one', () => {
    expect(
      excludedColumnsNamed('select content_hash, actor_count from evals.x'),
    ).toEqual([]);
  });

  it('reads text as a type unless it is qualified as a column', () => {
    expect(excludedColumnsNamed('returns table (suite text)')).toEqual([]);
    expect(excludedColumnsNamed('select note.text from notes note')).toEqual([
      'eval_annotation.text',
    ]);
  });
});
