import type {
  TableChromeState,
  TableDensityDefaults,
} from '#ui/components/Table/Table.types';

import {
  DEFAULT_TABLE_DENSITY,
  TABLE_DENSITY_ROW_HEIGHT,
} from '#ui/components/Table/Table.constants';

import { isTableDensity } from './isTableDensity.util';

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
  const density =
    [state.density, defaults.density].find(isTableDensity) ??
    DEFAULT_TABLE_DENSITY;
  const namedHeaderDensity = [state.headerDensity, defaults.headerDensity].find(
    isTableDensity,
  );
  const rowHeight = state.rowHeight ?? TABLE_DENSITY_ROW_HEIGHT[density];

  return {
    density,
    headerDensity: namedHeaderDensity ?? density,
    headerRowHeight:
      namedHeaderDensity === undefined
        ? rowHeight
        : TABLE_DENSITY_ROW_HEIGHT[namedHeaderDensity],
    rowHeight,
  };
};
