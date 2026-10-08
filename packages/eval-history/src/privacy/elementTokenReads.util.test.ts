import { describe, expect, it } from 'vite-plus/test';

import { elementTokenReads } from './elementTokenReads.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';

const PATH = 'eval_trial_detail.detail.dimensions';
const tokens = sqlTokens("e.value ->> 'score', e, other FROM f() e(value)");
const source = { declaration: 13, element: 'e', path: PATH, value: 'value' };

describe('elementTokenReads', () => {
  it('reads a field through the element alias and its column', () => {
    expect(elementTokenReads({ index: 0, source, tokens })).toEqual([
      `${PATH}[].score`,
    ]);
  });

  it('reads the whole element through the bare alias', () => {
    expect(elementTokenReads({ index: 6, source, tokens })).toEqual([
      `${PATH}[]`,
    ]);
  });

  it('reads nothing at the declaration, another identifier or a column after a dot', () => {
    expect(elementTokenReads({ index: 13, source, tokens })).toEqual([]);
    expect(elementTokenReads({ index: 15, source, tokens })).toEqual([]);
    expect(elementTokenReads({ index: 8, source, tokens })).toEqual([]);
    expect(elementTokenReads({ index: 2, source, tokens })).toEqual([]);
  });
});
