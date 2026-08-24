import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { isOrderConflictResolution } from './isOrderConflictResolution.util';
import { isPinConflictResolution } from './isPinConflictResolution.util';
import { isPinSide } from './isPinSide.util';
import { isUnpinConflictResolution } from './isUnpinConflictResolution.util';

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
