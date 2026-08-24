import type { PinConflictResolution } from '#ui/types/ui.types';

import { PIN_CONFLICT_VALUES } from './globalSettings.constants';

export const isPinConflictResolution = (
  value: unknown,
): value is PinConflictResolution => {
  return (
    typeof value === 'string' &&
    PIN_CONFLICT_VALUES.includes(value as (typeof PIN_CONFLICT_VALUES)[number])
  );
};
