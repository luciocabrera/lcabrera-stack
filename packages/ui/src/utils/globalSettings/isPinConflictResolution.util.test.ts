import { describe, expect, it } from 'vite-plus/test';

import { PIN_CONFLICT_VALUES } from './globalSettings.constants';
import { isPinConflictResolution } from './isPinConflictResolution.util';

describe('isPinConflictResolution', () => {
  it.each(PIN_CONFLICT_VALUES)('returns true for %s', (value) => {
    expect(isPinConflictResolution(value)).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isPinConflictResolution('unpin-all')).toBe(false);
    expect(isPinConflictResolution('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isPinConflictResolution(undefined)).toBe(false);
    expect(isPinConflictResolution(1)).toBe(false);
    expect(isPinConflictResolution({})).toBe(false);
  });
});
