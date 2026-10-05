import { describe, expect, it } from 'vite-plus/test';

import { resolveTableCellDelta } from './resolveTableCellDelta.util';

describe('resolveTableCellDelta', () => {
  it('reads a positive value as an increase', () => {
    expect(resolveTableCellDelta({ precision: 1, value: 0.24 })).toEqual({
      direction: 'increase',
      magnitude: '0.2',
    });
  });

  it('reads a negative value as a decrease and states its absolute value', () => {
    expect(resolveTableCellDelta({ precision: 1, value: -0.2 })).toEqual({
      direction: 'decrease',
      magnitude: '0.2',
    });
  });

  it('reads zero as unchanged', () => {
    expect(resolveTableCellDelta({ precision: 1, value: 0 })).toEqual({
      direction: 'unchanged',
      magnitude: '0.0',
    });
  });

  it('reads a change that rounds to zero at the precision as unchanged', () => {
    expect(resolveTableCellDelta({ precision: 1, value: -0.04 })).toEqual({
      direction: 'unchanged',
      magnitude: '0.0',
    });
  });

  it('reads a numeric string', () => {
    expect(
      resolveTableCellDelta({ precision: undefined, value: '-3' })?.direction,
    ).toBe('decrease');
  });

  it.each([['n/a'], [JSON.parse('null')], [Infinity]])(
    'answers undefined for %j',
    (value) => {
      expect(resolveTableCellDelta({ precision: 1, value })).toBeUndefined();
    },
  );
});
