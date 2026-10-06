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
    { message: 'params must be an object', params: 'x' },
    { message: 'unknown param "digits"', params: { digits: 1 } },
    { message: 'decrease must be a tone name', params: { decrease: '' } },
    { message: 'increase must be a tone name', params: { increase: 3 } },
    {
      message: 'unchanged must be a tone name',
      params: { unchanged: JSON.parse('null') },
    },
    {
      message: 'precision must be an integer from 0 to 20',
      params: { precision: 1.5 },
    },
  ])('rejects $params', ({ message, params }) => {
    expect(parseTableCellDeltaParams(params).issues?.[0]?.message).toBe(
      message,
    );
  });
});
