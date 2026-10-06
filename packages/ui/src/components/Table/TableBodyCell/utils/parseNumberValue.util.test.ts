import { describe, expect, it } from 'vite-plus/test';

import { parseNumberValue } from './parseNumberValue.util';

describe('parseNumberValue', () => {
  it('passes a number through', () => {
    expect(parseNumberValue(3.5)).toBe(3.5);
  });

  it('reads a numeric string, as a driver returns a numeric column', () => {
    expect(parseNumberValue(' 4.25 ')).toBe(4.25);
  });

  it.each([
    NaN,
    '',
    ' '.repeat(3),
    'abc',
    JSON.parse('null'),
    undefined,
    true,
    {},
  ])('answers undefined for %s', (value) => {
    expect(parseNumberValue(value)).toBeUndefined();
  });
});
