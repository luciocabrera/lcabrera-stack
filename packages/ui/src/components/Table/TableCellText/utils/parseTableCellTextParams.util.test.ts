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
    { params: 'x', path: undefined },
    { params: { italic: true }, path: ['italic'] },
    { params: { monospace: 'yes' }, path: ['monospace'] },
    { params: { weight: 'heavy' }, path: ['weight'] },
  ])('rejects $params', ({ params, path }) => {
    expect(parseTableCellTextParams(params).issues?.[0]?.path).toEqual(path);
  });
});
