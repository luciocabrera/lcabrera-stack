import { describe, expect, it } from 'vite-plus/test';

import { publicFieldsExpression } from './publicFieldsExpression.util.ts';

describe('publicFieldsExpression', () => {
  it('copies each allowed top-level field of a jsonb column, in code-unit order', () => {
    expect(publicFieldsExpression('eval_run.env')).toBe(
      "json_object('arch': env -> 'arch', 'ci_runner': env -> 'ci_runner', 'node': env -> 'node', 'os': env -> 'os' absent on null returning jsonb)",
    );
  });

  it('leaves out a field reached through an array element', () => {
    const expression = publicFieldsExpression('eval_trial_detail.detail');

    expect(expression).toContain("'verdict': detail -> 'verdict'");
    expect(expression).not.toContain('dimensions');
  });

  it('copies nothing from a column with no allowed field', () => {
    expect(publicFieldsExpression('eval_run.totals')).toBe(
      'json_object( absent on null returning jsonb)',
    );
  });
});
