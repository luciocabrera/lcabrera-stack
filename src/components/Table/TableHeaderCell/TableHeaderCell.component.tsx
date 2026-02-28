import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { MoreVerticalIcon } from '@/components/Icons';
import {
  useSetColumnSizing,
  useSetColumnSorting,
} from '@/components/Table/contexts/TableConfig/columns/actions';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '@/components/Table/contexts/TableData/data/selectors';
import { useColumnResize } from '@/components/Table/hooks';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import { useRenderTracker } from '@/utils/performance';

import type { TableHeaderCellProps } from './TableHeaderCell.types';

import {
  useGetColumnSizing,
  useGetNormalizedColumn,
} from '../contexts/TableConfig/columns/selectors';
import { FilterButton } from './FilterButton';
import { FilterDrawer } from './FilterDrawer';
import { SortIcon } from './SortIcon';
import {
  skelletonStyles,
  tableHeaderCellStyles,
} from './TableHeaderCell.stylex';
import { getNextSortDirection } from './utils';

export const TableHeaderCell = <TData extends Record<string, unknown>>({
  columnKey,
  customStylex,
  hasSettings = false,
  onSettingsClick,
  ...rest
}: TableHeaderCellProps<TData>) => {
  useRenderTracker({ componentName: `TableHeaderCell:${columnKey}` });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const columnSizing = useGetColumnSizing();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();

  const setColumnSizing = useSetColumnSizing();
  const setSorting = useSetColumnSorting();

  const { dataType, label, maxWidth, minWidth } = column;

  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const currentWidth = columnSizing[column.key] ?? effectiveMinWidth;
  const sortDirection = column.sortDirection;

  const isFilterable = column.isFilterable !== false;
  const isSortable = column.isSortable !== false;
  const isLoadingState = isLoading || isLoadingMore;

  const handleSort = () => {
    if (!isSortable) return;
    const nextDirection = getNextSortDirection(sortDirection);
    // const isMultiSort = event.shiftKey;
    setSorting({ columnKey, direction: nextDirection });
  };

  const { isResizing, onMouseDown } = useColumnResize({
    columnKey,
    currentWidth,
    maxWidth,
    minWidth: effectiveMinWidth,
    onResize: setColumnSizing,
  });

  const handleResizeDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setColumnSizing({ columnKey, width: undefined });
  };

  return (
    <th
      {...rest}
      {...stylex.props(
        tableHeaderCellStyles.base(effectiveMinWidth, currentWidth),
        customStylex,
      )}
    >
      {/* Loading overlay with shimmer */}
      {isLoadingState && (
        <div {...stylex.props(skelletonStyles.loadingOverlay)}>
          <div {...stylex.props(skelletonStyles.shimmerWave)} />
        </div>
      )}
      <span {...stylex.props(tableHeaderCellStyles.content)}>{label}</span>
      <div {...stylex.props(tableHeaderCellStyles.controls)}>
        {isSortable && (
          <button
            aria-label={`Sort by ${label}`}
            onClick={handleSort}
            type='button'
            {...stylex.props(
              tableHeaderCellStyles.sortButton,
              sortDirection !== undefined &&
                tableHeaderCellStyles.sortButtonActive,
            )}
          >
            <SortIcon direction={sortDirection} />
          </button>
        )}
        {isFilterable && dataType && (
          <>
            <FilterButton onClick={() => { setIsFilterOpen(true); }} />
            <FilterDrawer
              columnKey={columnKey}
              isOpen={isFilterOpen}
              onClose={() => { setIsFilterOpen(false); }}
            />
          </>
        )}
        {hasSettings && (
          <button
            aria-label={`Settings for ${label}`}
            onClick={onSettingsClick}
            type='button'
            {...stylex.props(tableHeaderCellStyles.settingsButton)}
          >
            <MoreVerticalIcon />
          </button>
        )}
      </div>
      {/* Resize handle */}
      <div
        aria-label={`Resize ${label} column`}
        onDoubleClick={handleResizeDoubleClick}
        onMouseDown={onMouseDown}
        role='separator'
        {...stylex.props(tableHeaderCellStyles.resizeHandle)}
      >
        <div
          {...stylex.props(
            tableHeaderCellStyles.resizeHandleLine,
            isResizing && tableHeaderCellStyles.resizeHandleActive,
          )}
        />
      </div>
    </th>
  );
};
