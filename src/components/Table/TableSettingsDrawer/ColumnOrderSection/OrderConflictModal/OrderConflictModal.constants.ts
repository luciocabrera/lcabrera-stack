import type { RadioOption } from '@/components/RadioOptionGroup/RadioOptionGroup.types';

import type { OrderConflictResolution } from '../ColumnOrderSection.types';

export const RESOLUTIONS: (RadioOption & {
  value: OrderConflictResolution;
})[] = [
  {
    description:
      'Apply the new column order and remove any pinning that no longer matches.',
    label: 'Apply order & remove conflicting pins',
    value: 'remove-conflicting-pins',
  },
  {
    description: 'Apply the new column order and clear all column pinning.',
    label: 'Apply order & reset all pins',
    value: 'reset-all-pins',
  },
  {
    description:
      'Move pinned columns to the edges so both the new order and all existing pins are preserved.',
    label: 'Apply order & keep all pins',
    value: 'pin-to-match-order',
  },
];
