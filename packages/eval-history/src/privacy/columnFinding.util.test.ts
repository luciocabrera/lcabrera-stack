import { describe, expect, it } from 'vite-plus/test';

import { columnFinding } from './columnFinding.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';

const DETAIL = 'eval_trial_detail.detail';

type FindingInArgs = {
  readonly column?: string;
  readonly sql: string;
};

const findingIn = ({ column = DETAIL, sql }: FindingInArgs) => {
  const tokens = sqlTokens(sql);

  return columnFinding({
    column,
    index: tokens.findIndex(({ value }) => value === column.split('.', 2)[1]),
    jsonbColumns: [DETAIL],
    tokens,
  });
};

describe('columnFinding', () => {
  it('reads a ->> path from a jsonb column', () => {
    expect(findingIn({ sql: "d.detail ->> 'judge_model'" })).toEqual({
      kind: 'read',
      path: `${DETAIL}.judge_model`,
    });
  });

  it('reads an element source from -> inside jsonb_array_elements', () => {
    expect(
      findingIn({
        sql: "jsonb_array_elements(d.detail -> 'dimensions') e(value)",
      }),
    ).toMatchObject({
      kind: 'source',
      source: { element: 'e', path: `${DETAIL}.dimensions`, value: 'value' },
    });
  });

  it('reads a -> sub-tree outside jsonb_array_elements as a path', () => {
    expect(findingIn({ sql: "d.detail -> 'dimensions'" })).toEqual({
      kind: 'read',
      path: `${DETAIL}.dimensions`,
    });
  });

  it('reports a jsonb column with no step and any read of a column that is not jsonb', () => {
    expect(findingIn({ sql: '(d.detail)::text' })).toEqual({
      kind: 'violation',
      text: DETAIL,
    });
    expect(
      findingIn({ column: 'eval_human_grade.grader', sql: "g.grader ->> 'x'" }),
    ).toEqual({
      kind: 'violation',
      text: 'eval_human_grade.grader',
    });
  });
});
