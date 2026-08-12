import * as stylex from '@stylexjs/stylex';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

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
import { getPinnedStyle, getShadowStyle, resolveAriaSort } from './utils';

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
  const { isResizable, isSortable, isStatic } =
    resolveColumnCapabilities(column);

  const pinnedStylex = getPinnedStyle(pinInfo);
  const shadowStylex = getShadowStyle(pinInfo);

  return (
    // role and aria-sort are declared, not inherited: `tableHeaderCellStyles`
    // `base()` sets `display: flex` on this `<th>` itself, which costs it its
    // implicit `columnheader` role in the accessibility tree (ADR-062). The
    // cause is this cell's own override, not the row's — restoring a table
    // `display` on `TableRow` would not make the attribute redundant.
    // All three are set after `{...rest}` so a caller cannot replace them.
    <th
      {...rest}
      aria-sort={resolveAriaSort({ isSortable, sortDirection })}
      role='columnheader'
      scope='col'
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
          {Boolean(isResizable) && (
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
