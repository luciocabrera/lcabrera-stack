import { expect, it } from 'vitest';

import { emptyToUndefined } from './emptyToUndefined.util.ts';

it('maps an empty string to undefined', () => {
  expect(emptyToUndefined('')).toBeUndefined();
});

it('returns a non-empty string unchanged', () => {
  expect(emptyToUndefined('TRACK-1')).toBe('TRACK-1');
});

it('preserves surrounding whitespace (does not trim)', () => {
  expect(emptyToUndefined(' note ')).toBe(' note ');
});
