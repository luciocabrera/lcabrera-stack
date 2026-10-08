import { describe, expect, it } from 'vite-plus/test';

import { sqlTokens } from './sqlTokens.util.ts';
import { tokenRole } from './tokenRole.util.ts';

type RoleOfArgs = {
  readonly sql: string;
  readonly value: string;
};

const roleOf = ({ sql, value }: RoleOfArgs) => {
  const tokens = sqlTokens(sql);

  return tokenRole({
    index: tokens.findIndex((token) => token.value === value),
    tokens,
  });
};

describe('tokenRole', () => {
  it.each([
    { expected: 'column', sql: 'd.detail', value: 'detail' },
    { expected: 'qualifier', sql: 'd.detail', value: 'd' },
    { expected: 'row', sql: 'to_jsonb(d.*)', value: 'd' },
    { expected: 'bare', sql: "detail ->> 'x'", value: 'detail' },
    { expected: 'bare', sql: 'row_to_json(d)', value: 'd' },
    { expected: 'other', sql: "'x'::text", value: 'text' },
    { expected: 'other', sql: 'to_jsonb(x)', value: 'to_jsonb' },
    { expected: 'other', sql: 'y AS detail', value: 'detail' },
    {
      expected: 'other',
      sql: 'FROM evals.eval_trial_detail',
      value: 'eval_trial_detail',
    },
    { expected: 'other', sql: "'detail'", value: 'detail' },
  ])('reads $value in $sql as $expected', ({ expected, sql, value }) => {
    expect(roleOf({ sql, value })).toBe(expected);
  });
});
