import type { OrderConflictResolution } from '#ui/types/pinningPreferences.types';

import { ORDER_CONFLICT_VALUES } from './globalSettings.constants';

/**
 * Narrow an unknown cookie value to an order-conflict resolution preference.
 * @param value - Raw value read from the settings cookie payload.
 * @returns True when the value is a valid order-conflict resolution.
 */
export const isOrderConflictResolution = (
  value: unknown,
): value is OrderConflictResolution => {
  return (
    typeof value === 'string' &&
    ORDER_CONFLICT_VALUES.includes(
      value as (typeof ORDER_CONFLICT_VALUES)[number],
    )
  );
};
