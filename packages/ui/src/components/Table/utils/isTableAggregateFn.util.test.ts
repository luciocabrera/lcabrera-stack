import { describe, expect, it } from 'vite-plus/test';

import { TABLE_AGGREGATE_FNS } from '../Table.constants';
import { isTableAggregateFn } from './isTableAggregateFn.util';

describe('isTableAggregateFn', () => {
  it('accepts every member of the vocabulary', () => {
    expect(TABLE_AGGREGATE_FNS.every(isTableAggregateFn)).toBe(true);
  });

  it('refuses a token outside the vocabulary', () => {
    expect(isTableAggregateFn('median')).toBe(false);
    expect(isTableAggregateFn('SUM')).toBe(false);
    expect(isTableAggregateFn('')).toBe(false);
  });

  it('refuses an inherited property name', () => {
    // The reason the guard uses `Object.hasOwn`: `in` answers `true` for every
    // `Object.prototype` member, so a hand-edited param could name one and be
    // carried into the aggregate lookup as if it were a function.
    expect(isTableAggregateFn('toString')).toBe(false);
    expect(isTableAggregateFn('constructor')).toBe(false);
    expect(isTableAggregateFn('__proto__')).toBe(false);
  });

  it('refuses a non-string', () => {
    // The JSON `null` a URL param actually delivers, parsed rather than written
    // as a literal.
    const parsedNull = JSON.parse('null') as unknown;

    expect(isTableAggregateFn(7)).toBe(false);
    expect(isTableAggregateFn(parsedNull)).toBe(false);
    expect(isTableAggregateFn(undefined)).toBe(false);
    expect(isTableAggregateFn({ fn: 'sum' })).toBe(false);
  });
});
