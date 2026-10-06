import { describe, expect, it } from 'vite-plus/test';

import { parseTableCellTextParams } from './parseTableCellTextParams.util';

describe('parseTableCellTextParams', () => {
  it('defaults to regular proportional text', () => {
    expect(parseTableCellTextParams({})).toEqual({
      value: { monospace: false, weight: 'regular' },
    });
  });

  it('keeps monospace and bold', () => {
    expect(
      parseTableCellTextParams({ monospace: true, weight: 'bold' }),
    ).toEqual({ value: { monospace: true, weight: 'bold' } });
  });

  it.each([
    { message: 'params must be an object', params: 'x' },
    { message: 'unknown param "italic"', params: { italic: true } },
    { message: 'monospace must be a boolean', params: { monospace: 'yes' } },
    {
      message: 'weight must be "regular" or "bold"',
      params: { weight: 'heavy' },
    },
  ])('rejects $params', ({ message, params }) => {
    expect(parseTableCellTextParams(params).issues?.[0]?.message).toBe(message);
  });
});
