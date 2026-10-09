import { describe, expect, it } from 'vite-plus/test';

import { parseTrialId } from './parseTrialId.util';

describe('parseTrialId', () => {
  it.each([
    { expected: '7', value: '7' },
    { expected: '7', value: '007' },
    { expected: '9223372036854775807', value: '9223372036854775807' },
  ])('reads $value as trial $expected', ({ expected, value }) => {
    expect(parseTrialId(value)).toBe(expected);
  });

  it.each([
    'abc',
    '',
    '0',
    '-1',
    '1.5',
    '1;drop',
    '9223372036854775808',
    '99999999999999999999',
  ])('ignores %j, which no bigint column can hold as an id', (value) => {
    expect(parseTrialId(value)).toBeUndefined();
  });

  it('ignores a missing parameter', () => {
    expect(parseTrialId(JSON.parse('null') as null)).toBeUndefined();
  });
});
