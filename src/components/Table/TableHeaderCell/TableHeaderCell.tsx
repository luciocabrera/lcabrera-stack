import * as stylex from '@stylexjs/stylex';

import type { SortDirection, TableHeaderCellProps } from './TableHeaderCell.types';

import { tableHeaderCellStyles } from './TableHeaderCell.stylex';

function SettingsIcon() {
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
      <circle cx="6" cy="2" fill="currentColor" r="1" />
      <circle cx="6" cy="6" fill="currentColor" r="1" />
      <circle cx="6" cy="10" fill="currentColor" r="1" />
    </svg>
  );
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') {
    return (
      <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
        <path d="M6 3L10 8H2L6 3Z" fill="currentColor" />
      </svg>
    );
  }
  if (direction === 'desc') {
    return (
      <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
        <path d="M6 9L2 4H10L6 9Z" fill="currentColor" />
      </svg>
    );
  }
  // Neutral/unsorted state
  return (
    <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
      <path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.5" />
      <path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export const TableHeaderCell = ({
  customStylex,
  hasSettings = false,
  isSortable = false,
  isSticky = true,
  label,
  minWidth,
  onSettingsClick,
  onSort,
  sortDirection,
  width,
  ...rest
}: TableHeaderCellProps) => {
  const handleSort = () => {
    if (!isSortable || !onSort) return;

    // Cycle through: undefined -> asc -> desc -> undefined
    const nextDirection: SortDirection =
      sortDirection === undefined ? 'asc' : sortDirection === 'asc' ? 'desc' : undefined;
    onSort(nextDirection);
  };

  return (
    <th
      style={{ minWidth, width }}
      {...rest}
      {...stylex.props(
        tableHeaderCellStyles.base,
        isSticky && tableHeaderCellStyles.sticky,
        customStylex,
      )}
    >
      <span {...stylex.props(tableHeaderCellStyles.content)}>{label}</span>
      <div {...stylex.props(tableHeaderCellStyles.controls)}>
        {isSortable && (
          <button
            aria-label={`Sort by ${label}`}
            onClick={handleSort}
            type="button"
            {...stylex.props(
              tableHeaderCellStyles.sortButton,
              sortDirection !== undefined && tableHeaderCellStyles.sortButtonActive,
            )}
          >
            <SortIcon direction={sortDirection} />
          </button>
        )}
        {hasSettings && (
          <button
            aria-label={`Settings for ${label}`}
            onClick={onSettingsClick}
            type="button"
            {...stylex.props(tableHeaderCellStyles.settingsButton)}
          >
            <SettingsIcon />
          </button>
        )}
      </div>
    </th>
  );
};
