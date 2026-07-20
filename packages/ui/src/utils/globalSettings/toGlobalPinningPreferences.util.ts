import { isObject } from '@repo/utils/guards/is-object.util';

import { isOrderConflictResolution } from './isOrderConflictResolution.util';
import { isPinConflictResolution } from './isPinConflictResolution.util';
import { isPinSide } from './isPinSide.util';
import { isUnpinConflictResolution } from './isUnpinConflictResolution.util';

/**
 * Parse the pinning slice of the settings cookie payload.
 *
 * Invalid or missing fields resolve to undefined so callers can fall back to
 * defaults per preference.
 * @param value - Raw `pinning` slice from the cookie payload.
 * @returns Validated pinning preferences, or undefined when the slice is not an object.
 */
export const toGlobalPinningPreferences = (value: unknown) => {
  if (!isObject(value)) {
    return;
  }

  const pinSide = isPinSide(value.pinSide) ? value.pinSide : undefined;
  const orderConflictResolution = isOrderConflictResolution(
    value.orderConflictResolution,
  )
    ? value.orderConflictResolution
    : undefined;
  const pinConflictResolution = isPinConflictResolution(
    value.pinConflictResolution,
  )
    ? value.pinConflictResolution
    : undefined;
  const unpinConflictResolution = isUnpinConflictResolution(
    value.unpinConflictResolution,
  )
    ? value.unpinConflictResolution
    : undefined;

  return {
    orderConflictResolution,
    pinConflictResolution,
    pinSide,
    unpinConflictResolution,
  };
};
