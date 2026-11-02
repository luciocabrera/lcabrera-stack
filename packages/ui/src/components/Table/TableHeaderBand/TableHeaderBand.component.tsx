import * as stylex from '@stylexjs/stylex';
import { use } from 'react';

import {
  useGetColumnSizing,
  useGetPinnedColumnOffsets,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';
import { sumColumnWidths } from '#ui/components/Table/utils/sumColumnWidths.util';

import type { TableHeaderBandProps } from './TableHeaderBand.types';

import { tableHeaderBandStyles } from './TableHeaderBand.stylex';
import { resolveBandPinnedStyle } from './utils';

export const TableHeaderBand = <TData extends Record<string, unknown>>({
  columns,
  label,
}: TableHeaderBandProps<TData>) => {
  const columnSizing = useGetColumnSizing<TData>();
  const pinnedOffsets = useGetPinnedColumnOffsets();
  const isStatic = use(TablePresentationContext).layout === 'static';

  const width = sumColumnWidths({ columns, columnSizing });

  const pinnedStylex = resolveBandPinnedStyle({
    leading: pinnedOffsets[columns[0]?.key as 'actions'],
    trailing: pinnedOffsets[columns.at(-1)?.key as 'actions'],
  });

  return (
    <th
      colSpan={isStatic ? columns.length : undefined}
      data-testid='table-header-band'
      {...stylex.props(
        tableHeaderBandStyles.base(width),
        label !== undefined && tableHeaderBandStyles.labelled,
        pinnedStylex,
        isStatic && tableHeaderBandStyles.staticLayout,
      )}
    >
      {label !== undefined && (
        <span {...stylex.props(tableHeaderBandStyles.label)}>{label}</span>
      )}
    </th>
  );
};
