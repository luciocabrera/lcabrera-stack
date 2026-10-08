import { describe, expect, it } from 'vite-plus/test';

import { fieldStep } from './fieldStep.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';

describe('fieldStep', () => {
  it('reads a -> or ->> step with a literal key', () => {
    expect(
      fieldStep({ index: 0, tokens: sqlTokens("detail ->> 'judge_model'") }),
    ).toEqual({
      key: 'judge_model',
      operator: '->>',
    });
    expect(
      fieldStep({ index: 0, tokens: sqlTokens("detail -> 'dimensions'") }),
    ).toEqual({
      key: 'dimensions',
      operator: '->',
    });
  });

  it.each([
    "detail #>> '{summary}'",
    "detail['summary']",
    'detail)::text',
    'detail ->> key',
  ])('reads no step from %s', (sql) => {
    expect(fieldStep({ index: 0, tokens: sqlTokens(sql) })).toBeUndefined();
  });
});
