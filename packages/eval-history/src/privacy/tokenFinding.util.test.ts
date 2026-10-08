import { describe, expect, it } from 'vite-plus/test';

import { sqlTokens } from './sqlTokens.util.ts';
import { tokenFinding } from './tokenFinding.util.ts';

const findingsIn = (sql: string) => {
  const tokens = sqlTokens(sql);

  return tokens.flatMap((_, index) =>
    tokenFinding({
      aliases: new Map([['g', ['eval_human_grade']]]),
      declarations: new Set([tokens.length - 1]),
      guardedByName: new Map([['grader', 'eval_human_grade.grader']]),
      index,
      jsonbColumns: [],
      tokens,
    }),
  );
};

describe('tokenFinding', () => {
  it('reports a guarded column and a whole-row alias, and not the declaration', () => {
    expect(
      findingsIn('SELECT g.grader, to_jsonb(g.*), row_to_json(g) FROM t g'),
    ).toEqual([
      { kind: 'violation', text: 'eval_human_grade.grader' },
      {
        kind: 'violation',
        text: 'eval_human_grade read as a whole row through g',
      },
      {
        kind: 'violation',
        text: 'eval_human_grade read as a whole row through g',
      },
    ]);
  });

  it('passes an unguarded column read through a guarded alias', () => {
    expect(findingsIn('SELECT g.score FROM t g')).toEqual([]);
  });
});
