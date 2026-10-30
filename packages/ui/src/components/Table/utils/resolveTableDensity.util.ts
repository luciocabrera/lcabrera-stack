import type {
  TableChromeState,
  TableDensityDefaults,
} from '#ui/components/Table/Table.types';

import {
  DEFAULT_TABLE_DENSITY,
  TABLE_DENSITY_ROW_HEIGHT,
} from '#ui/components/Table/Table.constants';

type ResolveTableDensityArgs = {
  readonly defaults: TableDensityDefaults;
  readonly state: Pick<
    TableChromeState,
    'density' | 'headerDensity' | 'rowHeight'
  >;
};

export const resolveTableDensity = ({
  defaults,
  state,
}: ResolveTableDensityArgs) => {
  const density = state.density ?? defaults.density ?? DEFAULT_TABLE_DENSITY;
  const headerDensity =
    state.headerDensity ?? defaults.headerDensity ?? density;

  return {
    density,
    headerDensity,
    headerRowHeight: state.rowHeight ?? TABLE_DENSITY_ROW_HEIGHT[headerDensity],
    rowHeight: state.rowHeight ?? TABLE_DENSITY_ROW_HEIGHT[density],
  };
};
