import type { RadioOption } from '@/components/RadioOptionGroup';
import type {
  PinConflictResolution,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolution,
  UnpinConflictResolutionPreferenceOption,
} from '@/types/pinningPreferences.types';
import type { PinSide } from '@/types/ui.types';

export const PIN_SIDE_OPTIONS: readonly RadioOption<PinSide>[] = [
  {
    description: 'Pin to the nearest edge based on column position',
    label: 'Closest edge',
    value: 'closest-edge',
  },
  {
    label: 'Pin to the left',
    value: 'left',
  },
  {
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
      label: 'Move column next to pinned columns',
      value: 'move-column',
    },
    {
      label: 'Pin all columns between edge and this column',
      value: 'pin-all-between',
    },
    {
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
