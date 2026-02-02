import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { MoreVerticalIcon } from '@/components/Icons';
import { useColumnResize } from '@/components/Table/hooks';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import {
  useSetColumnSizing,
  useSetColumnSorting,
} from '@/components/Table/TableContext/hooks/store/columns/actions';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '@/components/Table/TableContext/hooks/store/data/selectors';
import { useRenderTracker } from '@/utils/performance';

import type { TableHeaderCellProps } from './TableHeaderCell.types';

import { FilterButton } from './FilterButton';
import { FilterPopover } from './FilterPopover';
import { SortIcon } from './SortIcon';
import {
  skelletonStyles,
  tableHeaderCellStyles,
} from './TableHeaderCell.stylex';
import { getNextSortDirection } from './utils';

export const TableHeaderCell = <TData extends Record<string, unknown>>({
  columnKey,
  customStylex,
  dataType,
  fetchFilterOptions,
  filter,
  filterOptions,
  hasSettings = false,
  isFilterable = false,
  isSortable = false,
  label,
  maxWidth,
  minWidth,
  onSettingsClick,
  sortDirection,
  sortIndex: _sortIndex,
  width,
  ...rest
}: TableHeaderCellProps<TData>) => {
  useRenderTracker(`TableHeaderCell:${columnKey}`);

  const filterPopoverId = useId();

  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();

  const isLoadingState = isLoading || isLoadingMore;

  const setColumnSizing = useSetColumnSizing();
  const setSorting = useSetColumnSorting();

  const handleSort = () => {
    if (!isSortable) return;
    const nextDirection = getNextSortDirection(sortDirection);
    // const isMultiSort = event.shiftKey;
    setSorting({ columnKey, direction: nextDirection });
  };

  const currentWidth =
    typeof width === 'number' ? width : (minWidth ?? DEFAULT_MIN_COLUMN_WIDTH);

  const { isResizing, onMouseDown } = useColumnResize({
    columnKey,
    currentWidth,
    maxWidth,
    minWidth,
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
        tableHeaderCellStyles.base(minWidth, width),
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
            <FilterButton
              isActive={!!filter}
              popoverTargetId={filterPopoverId}
            />
            <FilterPopover
              column={{ dataType, key: columnKey, label }}
              fetchFilterOptions={fetchFilterOptions}
              filter={filter}
              filterOptions={filterOptions}
              popoverId={filterPopoverId}
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
