import { describe, expect, it } from 'vitest';

import { PIN_SIDE_VALUES } from './globalSettings.constants';
import { isPinSide } from './isPinSide.util';

describe('isPinSide', () => {
  it.each(PIN_SIDE_VALUES)('returns true for %s', (value) => {
    expect(isPinSide(value)).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isPinSide('top')).toBe(false);
    expect(isPinSide('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isPinSide(undefined)).toBe(false);
    expect(isPinSide(1)).toBe(false);
    expect(isPinSide({})).toBe(false);
  });
});
