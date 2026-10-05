import { describe, expect, it } from 'vite-plus/test';

import { parseTableCellDeltaParams } from './parseTableCellDeltaParams.util';

describe('parseTableCellDeltaParams', () => {
  it('defaults the three tones', () => {
    expect(parseTableCellDeltaParams({})).toEqual({
      value: { decrease: 'error', increase: 'success', unchanged: 'neutral' },
    });
  });

  it('keeps every param it is given', () => {
    expect(
      parseTableCellDeltaParams({
        decrease: 'caution',
        increase: 'info',
        precision: 1,
        unchanged: 'warning',
      }),
    ).toEqual({
      value: {
        decrease: 'caution',
        increase: 'info',
        precision: 1,
        unchanged: 'warning',
      },
    });
  });

  it.each([
    { params: 'x', path: undefined },
    { params: { digits: 1 }, path: ['digits'] },
    { params: { decrease: '' }, path: ['decrease'] },
    { params: { increase: 3 }, path: ['increase'] },
    { params: { unchanged: JSON.parse('null') }, path: ['unchanged'] },
    { params: { precision: 1.5 }, path: ['precision'] },
  ])('rejects $params', ({ params, path }) => {
    expect(parseTableCellDeltaParams(params).issues?.[0]?.path).toEqual(path);
  });
});
