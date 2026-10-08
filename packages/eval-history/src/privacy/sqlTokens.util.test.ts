import { describe, expect, it } from 'vite-plus/test';

import { sqlTokens } from './sqlTokens.util.ts';

const values = (text: string) => sqlTokens(text).map(({ value }) => value);

describe('sqlTokens', () => {
  it('splits a deparsed view into identifiers, operators, strings and punctuation', () => {
    expect(
      values(
        ` SELECT ("Raw".detail ->> 'summary'::text) AS s\n   FROM evals.eval_trial_detail "Raw";`,
      ),
    ).toEqual([
      'select',
      '(',
      'Raw',
      '.',
      'detail',
      '->>',
      'summary',
      '::',
      'text',
      ')',
      'as',
      's',
      'from',
      'evals',
      '.',
      'eval_trial_detail',
      'Raw',
      ';',
    ]);
  });

  it('marks a quoted identifier and unescapes doubled quotes', () => {
    expect(sqlTokens('"a""b" \'it\'\'s\'')).toEqual([
      { kind: 'identifier', quoted: true, value: 'a"b' },
      { kind: 'string', quoted: false, value: "it's" },
    ]);
  });

  it('reads a whole-row star, a subscript and a path operator', () => {
    expect(values("to_jsonb(d.*) #>> '{x}' detail['k'] 12")).toEqual([
      'to_jsonb',
      '(',
      'd',
      '.',
      '*',
      ')',
      '#>>',
      '{x}',
      'detail',
      '[',
      'k',
      ']',
      '12',
    ]);
  });
});
