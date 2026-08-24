import type { OrderConflictResolution } from '#ui/types/pinningPreferences.types';

import { ORDER_CONFLICT_VALUES } from './globalSettings.constants';

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
