import { DEFAULT_MIN_COLUMN_WIDTH } from '@repo/ui/components/Table/Table.constants';
import * as stylex from '@stylexjs/stylex';

import type { TableHeaderCellProps } from './TableHeaderCell.types';

import {
  useGetColumnWidth,
  useGetNormalizedColumn,
  useGetPinnedColumnInfo,
} from '../contexts/TableConfig/columns/selectors';
import { ResizeHandle } from './ResizeHandle';
import { TableHeaderActionsMenu } from './TableHeaderActionsMenu';
import {
  skeletonStyles,
  tableHeaderCellStyles,
} from './TableHeaderCell.stylex';
import { getPinnedStyle, getShadowStyle } from './utils';

export const TableHeaderCell = <TData extends Record<string, unknown>>({
  columnKey,
  customStylex,
  hasSettings = false,
  isLoadingState = false,
  ...rest
}: TableHeaderCellProps<TData>) => {
  const column = useGetNormalizedColumn<TData>(columnKey);
  const width = useGetColumnWidth<TData>(columnKey);
  const pinInfo = useGetPinnedColumnInfo<TData>(columnKey);

  const { isHeaderHidden, label, minWidth } = column;
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const currentWidth = width ?? effectiveMinWidth;
  const sortDirection = column.sortDirection;
  const isSortable = column.isSortable !== false;
  const isStatic = column.isStatic === true;

  const pinnedStylex = getPinnedStyle(pinInfo);
  const shadowStylex = getShadowStyle(pinInfo);

  return (
    <th
      {...rest}
      {...stylex.props(
        tableHeaderCellStyles.base(effectiveMinWidth, currentWidth),
        pinnedStylex,
        shadowStylex,
        customStylex,
      )}
    >
      {Boolean(isLoadingState) && (
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      )}
      {!isHeaderHidden && (
        <>
          <span {...stylex.props(tableHeaderCellStyles.content)}>{label}</span>
          {column.isResizable !== false && !column.isStatic && (
            <ResizeHandle columnKey={columnKey} columnLabel={label} />
          )}
          <TableHeaderActionsMenu
            columnKey={columnKey}
            columnLabel={label}
            hasSettings={hasSettings}
            isSortable={isSortable}
            isStatic={isStatic}
            pinSide={pinInfo?.side}
            sortDirection={sortDirection}
          />
        </>
      )}
    </th>
  );
};
