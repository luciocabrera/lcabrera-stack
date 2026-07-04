import { describe, expect, it } from 'vitest';

import { toGlobalPinningPreferences } from './toGlobalPinningPreferences.util';

describe('toGlobalPinningPreferences', () => {
  it('returns undefined for non-object values', () => {
    expect(toGlobalPinningPreferences(undefined)).toBeUndefined();
    expect(toGlobalPinningPreferences(null)).toBeUndefined();
    expect(toGlobalPinningPreferences('left')).toBeUndefined();
    expect(toGlobalPinningPreferences(1)).toBeUndefined();
  });

  it('parses a fully valid pinning slice', () => {
    expect(
      toGlobalPinningPreferences({
        orderConflictResolution: 'reset-all-pins',
        pinConflictResolution: 'move-column',
        pinSide: 'left',
        unpinConflictResolution: 'unpin-beyond',
      }),
    ).toEqual({
      orderConflictResolution: 'reset-all-pins',
      pinConflictResolution: 'move-column',
      pinSide: 'left',
      unpinConflictResolution: 'unpin-beyond',
    });
  });

  it('drops invalid fields independently', () => {
    expect(
      toGlobalPinningPreferences({
        orderConflictResolution: 'bogus',
        pinConflictResolution: 42,
        pinSide: 'right',
        unpinConflictResolution: null,
      }),
    ).toEqual({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: 'right',
      unpinConflictResolution: undefined,
    });
  });

  it('returns all-undefined preferences for an empty object', () => {
    expect(toGlobalPinningPreferences({})).toEqual({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });
  });
});
