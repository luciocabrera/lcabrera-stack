import type { RadioOption } from '@lcabrera/ui/components/RadioOptionGroup';
import type {
  OrderConflictResolution,
  OrderConflictResolutionPreferenceOption,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolution,
  UnpinConflictResolutionPreferenceOption,
} from '@lcabrera/ui/types/pinningPreferences.types';
import type {
  PinConflictResolution,
  PinSide,
} from '@lcabrera/ui/types/ui.types';

export const ORDER_CONFLICT_OPTIONS: readonly RadioOption<OrderConflictResolution>[] =
  [
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

export const ORDER_CONFLICT_PREFERENCE_OPTIONS: readonly RadioOption<OrderConflictResolutionPreferenceOption>[] =
  [
    ...ORDER_CONFLICT_OPTIONS,
    {
      description: 'Keep prompting every time column order breaks pinning',
      label: 'Always ask',
      value: 'always-ask',
    },
  ];

export const PIN_SIDE_OPTIONS: readonly RadioOption<PinSide>[] = [
  {
    description: 'Pin to the nearest edge based on column position',
    label: 'Closest edge',
    value: 'closest-edge',
  },
  {
    description: 'Pin this column to the left side of the table',
    label: 'Pin to the left',
    value: 'left',
  },
  {
    description: 'Pin this column to the right side of the table',
    label: 'Pin to the right',
    value: 'right',
  },
];

export const PIN_SIDE_PREFERENCE_OPTIONS: readonly RadioOption<PinSidePreferenceOption>[] =
  [
    ...PIN_SIDE_OPTIONS,
    {
      description: 'Keep prompting every time you pin a column',
      label: 'Always ask',
      value: 'always-ask',
    },
  ];

export const PIN_CONFLICT_OPTIONS: readonly RadioOption<PinConflictResolution>[] =
  [
    {
      description:
        'Reorder the column to sit adjacent to the current pinned group',
      label: 'Move column next to pinned columns',
      value: 'move-column',
    },
    {
      description:
        'Extend the pinned zone by also pinning all columns in between',
      label: 'Pin all columns between edge and this column',
      value: 'pin-all-between',
    },
    {
      description:
        'Pin this column in place without reordering any other columns',
      label: 'Pin without changing column order',
      value: 'pin-only',
    },
  ];

export const PIN_CONFLICT_PREFERENCE_OPTIONS: readonly RadioOption<PinConflictResolutionPreferenceOption>[] =
  [
    ...PIN_CONFLICT_OPTIONS,
    {
      description: 'Keep prompting every time there is a pin conflict',
      label: 'Always ask',
      value: 'always-ask',
    },
  ];

export const UNPIN_CONFLICT_OPTIONS: readonly RadioOption<UnpinConflictResolution>[] =
  [
    {
      description:
        'Also unpin columns between this one and the center of the table',
      label: 'Unpin this and columns beyond',
      value: 'unpin-beyond',
    },
    {
      description:
        'Move remaining pinned columns together to keep them contiguous',
      label: 'Reorder to fill the gap',
      value: 'reorder-to-fill',
    },
  ];

export const UNPIN_CONFLICT_PREFERENCE_OPTIONS: readonly RadioOption<UnpinConflictResolutionPreferenceOption>[] =
  [
    ...UNPIN_CONFLICT_OPTIONS,
    {
      description: 'Keep prompting every time there is an unpin conflict',
      label: 'Always ask',
      value: 'always-ask',
    },
  ];
