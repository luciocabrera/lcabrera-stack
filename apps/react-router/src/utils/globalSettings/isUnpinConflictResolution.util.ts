import type { UnpinConflictResolution } from '@/types/pinningPreferences.types';

import { UNPIN_CONFLICT_VALUES } from './globalSettings.constants';

/**
 * Narrow an unknown cookie value to an unpin-conflict resolution preference.
 * @param value - Raw value read from the settings cookie payload.
 * @returns True when the value is a valid unpin-conflict resolution.
 */
export const isUnpinConflictResolution = (
  value: unknown,
): value is UnpinConflictResolution => {
  return (
    typeof value === 'string' &&
    UNPIN_CONFLICT_VALUES.includes(
      value as (typeof UNPIN_CONFLICT_VALUES)[number],
    )
  );
};
