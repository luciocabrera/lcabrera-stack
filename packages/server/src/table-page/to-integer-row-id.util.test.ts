import { expect, it } from 'vite-plus/test';

import { toIntegerRowId } from './to-integer-row-id.util.ts';

it('returns the numeric id for a positive integer', () => {
  expect(toIntegerRowId('42')).toBe(42);
});

it.each(['abc', '1.5', '0', '-3', '9007199254740993'])('refuses %p', (raw) => {
  expect(toIntegerRowId(raw)).toBeUndefined();
});
