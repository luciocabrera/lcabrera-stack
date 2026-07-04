import { describe, expect, it } from 'vitest';

import { UNPIN_CONFLICT_VALUES } from './globalSettings.constants';
import { isUnpinConflictResolution } from './isUnpinConflictResolution.util';

describe('isUnpinConflictResolution', () => {
  it.each(UNPIN_CONFLICT_VALUES)('returns true for %s', (value) => {
    expect(isUnpinConflictResolution(value)).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isUnpinConflictResolution('shift-left')).toBe(false);
    expect(isUnpinConflictResolution('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isUnpinConflictResolution(undefined)).toBe(false);
    expect(isUnpinConflictResolution(1)).toBe(false);
    expect(isUnpinConflictResolution({})).toBe(false);
  });
});
