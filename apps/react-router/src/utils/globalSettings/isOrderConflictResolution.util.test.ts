import { describe, expect, it } from 'vitest';

import { ORDER_CONFLICT_VALUES } from './globalSettings.constants';
import { isOrderConflictResolution } from './isOrderConflictResolution.util';

describe('isOrderConflictResolution', () => {
  it.each(ORDER_CONFLICT_VALUES)('returns true for %s', (value) => {
    expect(isOrderConflictResolution(value)).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isOrderConflictResolution('keep-order')).toBe(false);
    expect(isOrderConflictResolution('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isOrderConflictResolution(undefined)).toBe(false);
    expect(isOrderConflictResolution(1)).toBe(false);
    expect(isOrderConflictResolution({})).toBe(false);
  });
});
