import { describe, expect, it } from 'vite-plus/test';

import { elementFieldPath } from './elementFieldPath.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';

const PATH = 'eval_trial_detail.detail.dimensions';

describe('elementFieldPath', () => {
  it('names the field a step takes from an element', () => {
    expect(
      elementFieldPath({
        index: 0,
        path: PATH,
        tokens: sqlTokens("value ->> 'score'"),
      }),
    ).toBe(`${PATH}[].score`);
  });

  it('names the whole element when no step follows', () => {
    expect(
      elementFieldPath({ index: 0, path: PATH, tokens: sqlTokens('value)') }),
    ).toBe(`${PATH}[]`);
  });
});
