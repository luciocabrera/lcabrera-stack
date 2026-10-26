import { describe, expect, it } from 'vite-plus/test';

import { toCellText } from './toCellText.util';

describe('toCellText', () => {
  it('keeps a string as it is', () => {
    expect(toCellText('Alpha')).toBe('Alpha');
  });

  it('writes numbers, booleans and bigints as their text', () => {
    expect(toCellText(4.5)).toBe('4.5');
    expect(toCellText(true)).toBe('true');
    expect(toCellText(7n)).toBe('7');
  });

  it('writes a date as its ISO text', () => {
    expect(toCellText(new Date('2024-01-02T00:00:00.000Z'))).toBe(
      '2024-01-02T00:00:00.000Z',
    );
  });

  it('serialises an object or array rather than naming its type', () => {
    expect(toCellText({ a: 1 })).toBe('{"a":1}');
    expect(toCellText([1, 2])).toBe('[1,2]');
  });

  it('writes nothing for a value JSON cannot hold', () => {
    expect(toCellText(undefined)).toBe('');
  });
});
