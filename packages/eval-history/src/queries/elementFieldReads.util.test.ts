import { describe, expect, it } from 'vite-plus/test';

import { elementFieldReads } from './elementFieldReads.util.ts';

const path = 'eval_trial_detail.detail.dimensions';

describe('elementFieldReads', () => {
  it('names the field each read of an array element takes', () => {
    expect(
      elementFieldReads({
        definition:
          "SELECT (dimension.value ->> 'score'::text) WHERE (dimension.value ->> 'name'::text) = x",
        element: 'dimension.value',
        path,
      }),
    ).toEqual([`${path}[].score`, `${path}[].name`]);
  });

  it('reports a whole element when it is read without a field', () => {
    expect(
      elementFieldReads({
        definition:
          "SELECT dimension.value, (dimension.value -> 'feedback'::text)",
        element: 'dimension.value',
        path,
      }),
    ).toEqual([`${path}[]`, `${path}[]`]);
  });
});
