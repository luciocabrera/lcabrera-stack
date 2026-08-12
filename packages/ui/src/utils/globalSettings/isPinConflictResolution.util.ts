import type { PinConflictResolution } from '#ui/types/ui.types';

import { PIN_CONFLICT_VALUES } from './globalSettings.constants';

/**
 * Narrow an unknown cookie value to a pin-conflict resolution preference.
 * @param value - Raw value read from the settings cookie payload.
 * @returns True when the value is a valid pin-conflict resolution.
 */
export const isPinConflictResolution = (
  value: unknown,
): value is PinConflictResolution => {
  return (
    typeof value === 'string' &&
    PIN_CONFLICT_VALUES.includes(value as (typeof PIN_CONFLICT_VALUES)[number])
  );
};
