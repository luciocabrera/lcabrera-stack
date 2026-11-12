import type { TableDensity } from '#ui/components/Table/Table.types';

import { TABLE_DENSITY_LABELS } from '#ui/components/Table/Table.constants';

export const toFollowsRowsLabel = (defaultDensity: TableDensity | undefined) =>
  defaultDensity === undefined
    ? 'Same as rows'
    : `Default (${TABLE_DENSITY_LABELS[defaultDensity]})`;
