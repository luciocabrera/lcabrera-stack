import { describe, expect, it } from 'vite-plus/test';

import { tableAliases } from './tableAliases.util.ts';

describe('tableAliases', () => {
  it('reads the alias a definition gives a table', () => {
    expect(
      tableAliases({
        definition:
          'FROM evals.eval_human_grade grade JOIN evals.eval_trial_detail detail ON true',
        table: 'eval_trial_detail',
      }),
    ).toEqual(['detail']);
  });

  it('falls back to the table name when no alias follows', () => {
    expect(
      tableAliases({
        definition:
          'FROM evals.eval_trial_detail\n  JOIN evals.eval_trial t ON true',
        table: 'eval_trial_detail',
      }),
    ).toEqual(['eval_trial_detail']);
    expect(
      tableAliases({
        definition: 'FROM evals.eval_trial_detail WHERE true',
        table: 'eval_trial_detail',
      }),
    ).toEqual(['eval_trial_detail']);
  });

  it('names each alias once, and none for a table the definition never reads', () => {
    expect(
      tableAliases({
        definition:
          'FROM evals.eval_trial_detail a JOIN evals.eval_trial_detail b ON true JOIN evals.eval_trial_detail a ON true',
        table: 'eval_trial_detail',
      }),
    ).toEqual(['a', 'b']);
    expect(
      tableAliases({
        definition: 'FROM evals.eval_run run',
        table: 'eval_trial_detail',
      }),
    ).toEqual([]);
  });
});
