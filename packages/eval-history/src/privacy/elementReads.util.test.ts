import { describe, expect, it } from 'vite-plus/test';

import { elementReads } from './elementReads.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';

const PATH = 'eval_trial_detail.detail.dimensions';

const readsIn = (select: string) => {
  const sql = `SELECT ${select} FROM jsonb_array_elements(x) e(value)`;
  const tokens = sqlTokens(sql);
  const declaration = tokens.findLastIndex(({ value }) => value === 'e');

  return elementReads({
    source: { declaration, element: 'e', path: PATH, value: 'value' },
    tokens,
  });
};

describe('elementReads', () => {
  it('names the field each read of an element takes', () => {
    expect(
      readsIn("(e.value ->> 'score'::text), (e.value ->> 'name'::text)"),
    ).toEqual([`${PATH}[].score`, `${PATH}[].name`]);
  });

  it('reports a whole element read through its column, its alias or bare', () => {
    expect(readsIn('e.value, to_jsonb(e.value)')).toEqual([
      `${PATH}[]`,
      `${PATH}[]`,
    ]);
    expect(readsIn('to_jsonb(e)')).toEqual([`${PATH}[]`]);
    expect(readsIn('e.*')).toEqual([`${PATH}[]`]);
    expect(readsIn("value ->> 'feedback'")).toEqual([`${PATH}[].feedback`]);
  });
});
