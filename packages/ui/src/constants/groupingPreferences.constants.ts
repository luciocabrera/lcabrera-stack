import type { RadioOption } from '#ui/components/RadioOptionGroup';
import type {
  TableGroupFold,
  TableGroupingMode,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

export const GROUPING_MODE_PREFERENCE_OPTIONS: readonly RadioOption<TableGroupingMode>[] =
  [
    {
      description:
        'Group rows only. Each group shows its own measures and nothing else.',
      label: 'Groups only',
      value: 'flat',
    },
    {
      description:
        'Add a subtotal row per level and a grand total, so each group totals the rows beneath it.',
      label: 'Groups with subtotals',
      value: 'rollup',
    },
  ];

export const TOTALS_PLACEMENT_PREFERENCE_OPTIONS: readonly RadioOption<TableTotalsPlacement>[] =
  [
    {
      description: 'A subtotal closes the rows it totals.',
      label: 'Below their rows',
      value: 'last',
    },
    {
      description: 'A subtotal heads the rows it totals.',
      label: 'Above their rows',
      value: 'first',
    },
  ];

export const GROUP_FOLD_PREFERENCE_OPTIONS: readonly RadioOption<TableGroupFold>[] =
  [
    {
      description: 'Every group opens on load, showing the rows beneath it.',
      label: 'Start expanded',
      value: 'expanded',
    },
    {
      description:
        'Every group opens closed, so a grouped table lands on its summary rows.',
      label: 'Start collapsed',
      value: 'collapsed',
    },
  ];
