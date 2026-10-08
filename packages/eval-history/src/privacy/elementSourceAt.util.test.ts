import { describe, expect, it } from 'vite-plus/test';

import { elementSourceAt } from './elementSourceAt.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';

const PATH = 'eval_trial_detail.detail.dimensions';

const sourceIn = (sql: string) => {
  const tokens = sqlTokens(sql);
  const first = tokens.findIndex(({ value }) => value === 'd');
  const last = tokens.findIndex(({ value }) => value === 'dimensions');

  return elementSourceAt({ first, last, path: PATH, tokens });
};

describe('elementSourceAt', () => {
  it('reads the element alias of jsonb_array_elements, parenthesised or not', () => {
    expect(
      sourceIn(
        "LATERAL jsonb_array_elements((d.detail -> 'dimensions'::text)) e(value)",
      ),
    ).toEqual({ declaration: 13, element: 'e', path: PATH, value: 'value' });
    expect(
      sourceIn("jsonb_array_elements(d.detail -> 'dimensions') e(value)"),
    ).toMatchObject({
      element: 'e',
      value: 'value',
    });
  });

  it('reads no source outside jsonb_array_elements or without a column alias', () => {
    expect(
      sourceIn("to_jsonb(d.detail -> 'dimensions') e(value)"),
    ).toBeUndefined();
    expect(
      sourceIn("jsonb_array_elements(d.detail -> 'dimensions') e"),
    ).toBeUndefined();
    expect(sourceIn("(d.detail -> 'dimensions')")).toBeUndefined();
  });
});
