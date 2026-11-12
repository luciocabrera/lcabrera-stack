import type { RadioOption } from '#ui/components/RadioOptionGroup';
import type { TableDensity } from '#ui/components/Table/Table.types';

import {
  TABLE_DENSITY_LABELS,
  TABLE_DENSITY_LEVELS,
  TABLE_DENSITY_SCALE,
} from '#ui/components/Table/Table.constants';

export const SAME_AS_ROWS_PREFERENCE = 'same-as-rows';

const toDensityLevelOptions = (
  heightSuffix?: string,
): readonly RadioOption<TableDensity>[] =>
  TABLE_DENSITY_LEVELS.map((value) => ({
    ...(heightSuffix !== undefined && {
      description: `${TABLE_DENSITY_SCALE[value].rowHeight}px ${heightSuffix}`,
    }),
    label: TABLE_DENSITY_LABELS[value],
    value,
  }));

export const TABLE_DENSITY_PREFERENCE_OPTIONS = toDensityLevelOptions('rows');

export const TABLE_HEADER_DENSITY_PREFERENCE_OPTIONS: readonly RadioOption<
  TableDensity | typeof SAME_AS_ROWS_PREFERENCE
>[] = [
  {
    description: 'The column header row takes the same height as the rows.',
    label: 'Same as rows',
    value: SAME_AS_ROWS_PREFERENCE,
  },
  ...toDensityLevelOptions('tall'),
];

export const TABLE_TITLE_DENSITY_PREFERENCE_OPTIONS: readonly RadioOption<
  TableDensity | typeof SAME_AS_ROWS_PREFERENCE
>[] = [
  {
    description: 'The title bar follows the row density.',
    label: 'Same as rows',
    value: SAME_AS_ROWS_PREFERENCE,
  },
  ...toDensityLevelOptions(),
];
