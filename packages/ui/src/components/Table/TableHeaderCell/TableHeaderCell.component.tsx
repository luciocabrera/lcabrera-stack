import * as stylex from '@stylexjs/stylex';
import { use } from 'react';

import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';
import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { resolveColumnStartWidth } from '#ui/components/Table/utils/resolveColumnStartWidth.util';
import { skeleton } from '#ui/design-system/tokens/commons.stylex';

import type { TableHeaderCellProps } from './TableHeaderCell.types';

import {
  useGetColumnWidth,
  useGetNormalizedColumn,
  useGetPinnedColumnInfo,
} from '../contexts/TableConfig/columns/selectors';
import { ResizeHandle } from './ResizeHandle';
import { TableHeaderActionsMenu } from './TableHeaderActionsMenu';
import { tableHeaderCellStyles } from './TableHeaderCell.stylex';
import {
  getHeaderLayoutStyles,
  getPinnedStyle,
  getShadowStyle,
  resolveAriaSort,
} from './utils';

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
  const { features, layout } = use(TablePresentationContext);

  const { isHeaderHidden, label, minWidth } = column;
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const currentWidth = width ?? resolveColumnStartWidth(column);
  const sortDirection = column.sortDirection;
  const { isResizable, isSortable, isStatic } =
    resolveColumnCapabilities(column);

  const pinnedStylex = getPinnedStyle(pinInfo);
  const shadowStylex = getShadowStyle(pinInfo);
  const layoutStylex = getHeaderLayoutStyles({
    column,
    isSized: width !== undefined,
    layout,
    pinInfo,
  });

  return (
    <th
      {...rest}
      aria-label={
        column.headerGroupLabel === undefined
          ? undefined
          : `${column.headerGroupLabel} ${label}`
      }
      aria-sort={resolveAriaSort({ isSortable, sortDirection })}
      role='columnheader'
      scope='col'
      {...stylex.props(
        tableHeaderCellStyles.base(effectiveMinWidth, currentWidth),
        pinnedStylex,
        shadowStylex,
        layoutStylex.cell,
        customStylex,
      )}
    >
      {Boolean(isLoadingState) && (
        <div {...stylex.props(skeleton.loadingOverlay)}>
          <div {...stylex.props(skeleton.shimmerWave)} />
        </div>
      )}
      {!isHeaderHidden && (
        <>
          <span
            data-testid='table-header-label'
            {...stylex.props(tableHeaderCellStyles.content, layoutStylex.label)}
          >
            {label}
          </span>
          {Boolean(isResizable) && features.resize && (
            <ResizeHandle columnKey={columnKey} columnLabel={label} />
          )}
          {features.columnMenu !== false && (
            <TableHeaderActionsMenu
              columnKey={columnKey}
              columnLabel={label}
              hasSettings={hasSettings && features.settings}
              isSortable={isSortable}
              isStatic={isStatic}
              pinSide={pinInfo?.side}
              sortDirection={sortDirection}
            />
          )}
        </>
      )}
    </th>
  );
};
