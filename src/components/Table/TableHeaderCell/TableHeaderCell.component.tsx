import * as stylex from '@stylexjs/stylex';

import { MoreVerticalIcon } from '@/components/Icons';
import { useColumnResize } from '@/components/Table/hooks';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';

import type { TableHeaderCellProps } from './TableHeaderCell.types';

import { SortIcon } from './SortIcon';
import {
  skelletonStyles,
  tableHeaderCellStyles,
} from './TableHeaderCell.stylex';
import { getNextSortDirection } from './utils';

export const TableHeaderCell = ({
  columnKey,
  customStylex,
  hasSettings = false,
  isLoading = false,
  isSortable = false,
  label,
  maxWidth,
  minWidth,
  onResize,
  onResizeDoubleClick,
  onSettingsClick,
  onSort,
  sortDirection,
  sortIndex: _sortIndex, // Rename to indicate unused
  width,
  ...rest
}: TableHeaderCellProps) => {
  const handleSort = (event: React.MouseEvent) => {
    if (!isSortable || !onSort) return;
    const nextDirection = getNextSortDirection(sortDirection);
    const isMultiSort = event.shiftKey;
    onSort({ columnKey, direction: nextDirection, isMultiSort });
  };

  const currentWidth =
    typeof width === 'number' ? width : (minWidth ?? DEFAULT_MIN_COLUMN_WIDTH);

  const { isResizing, onMouseDown } = useColumnResize({
    columnKey,
    currentWidth,
    maxWidth,
    minWidth,
    onResize:
      onResize ??
      (() => {
        // No-op when onResize is not provided
      }),
  });

  const handleResizeDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onResizeDoubleClick?.(columnKey);
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
      {isLoading && (
        <div {...stylex.props(skelletonStyles.loadingOverlay)}>
          <div {...stylex.props(skelletonStyles.shimmerWave)} />
        </div>
      )}
      <span {...stylex.props(tableHeaderCellStyles.content)}>{label}</span>
      <div {...stylex.props(tableHeaderCellStyles.controls)}>
        {isSortable && (
          <button
            aria-label={`Sort by ${label}`}
            onClick={(e) => {
              handleSort(e);
            }}
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
      {onResize && (
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
      )}
    </th>
  );
};
