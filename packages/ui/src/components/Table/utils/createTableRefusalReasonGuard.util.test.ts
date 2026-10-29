import { describe, expect, it } from 'vite-plus/test';

import { createTableRefusalReasonGuard } from './createTableRefusalReasonGuard.util';

const isColorReason = createTableRefusalReasonGuard<'blue' | 'red'>({
  blue: true,
  red: true,
});

describe('createTableRefusalReasonGuard', () => {
  it.each(['blue', 'red'])(
    'admits %s from the vocabulary it closes over',
    (reason) => {
      expect(isColorReason(reason)).toBe(true);
    },
  );

  it('refuses a token outside the vocabulary', () => {
    expect(isColorReason('green')).toBe(false);
    expect(isColorReason('')).toBe(false);
  });

  it('refuses a non-string', () => {
    expect(isColorReason(undefined)).toBe(false);
    expect(isColorReason(1)).toBe(false);
  });

  it('does not admit an inherited property through the prototype chain', () => {
    expect(isColorReason('toString')).toBe(false);
    expect(isColorReason('constructor')).toBe(false);
  });
});
