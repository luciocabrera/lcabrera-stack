import { describe, expect, it } from 'vite-plus/test';

import { relationAliases } from './relationAliases.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';

const read = (sql: string) =>
  relationAliases({
    tables: ['eval_trial_detail', 'eval_human_grade'],
    tokens: sqlTokens(sql),
  });

describe('relationAliases', () => {
  it('reads plain and quoted aliases, and the table name when none follows', () => {
    const { aliases, declared, problems } = read(
      'FROM evals.eval_trial_detail "Raw" JOIN evals.eval_human_grade g ON true, (SELECT 1 FROM evals.eval_trial_detail WHERE true) x',
    );

    expect(Object.fromEntries(aliases)).toEqual({
      eval_trial_detail: ['eval_trial_detail'],
      g: ['eval_human_grade'],
      Raw: ['eval_trial_detail'],
    });
    expect([...declared]).toEqual(['eval_trial_detail', 'eval_human_grade']);
    expect(problems).toEqual([]);
  });

  it('reports an alias it cannot read and one that renames columns', () => {
    expect(read('FROM evals.eval_trial_detail * x').problems).toEqual([
      'evals.eval_trial_detail has an alias the check cannot read',
    ]);
    expect(
      read('FROM evals.eval_trial_detail d(a, b, payload)').problems,
    ).toEqual(['evals.eval_trial_detail d renames its columns']);
  });

  it('ignores relations it does not guard', () => {
    expect(read('FROM evals.eval_run run').declared.size).toBe(0);
  });
});
