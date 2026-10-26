import { describe, expect, it } from 'vite-plus/test';

import { isAbsentOr } from './is-absent-or.util.ts';

const isText = (value: unknown) => typeof value === 'string';

describe('isAbsentOr', () => {
  it('accepts a field that is missing', () => {
    expect(isAbsentOr({ check: isText, fields: {}, key: 'value' })).toBe(true);
  });

  it('accepts a field that is present and undefined', () => {
    expect(
      isAbsentOr({ check: isText, fields: { value: undefined }, key: 'value' }),
    ).toBe(true);
  });

  it('accepts a present field the check accepts', () => {
    expect(
      isAbsentOr({ check: isText, fields: { value: 'a' }, key: 'value' }),
    ).toBe(true);
  });

  it('rejects a present field the check rejects', () => {
    expect(
      isAbsentOr({ check: isText, fields: { value: 1 }, key: 'value' }),
    ).toBe(false);
  });
});
