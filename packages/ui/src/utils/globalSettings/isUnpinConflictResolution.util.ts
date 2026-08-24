import type { UnpinConflictResolution } from '#ui/types/pinningPreferences.types';

import { UNPIN_CONFLICT_VALUES } from './globalSettings.constants';

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
