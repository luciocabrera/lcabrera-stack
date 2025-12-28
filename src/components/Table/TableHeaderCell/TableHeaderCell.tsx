import * as stylex from '@stylexjs/stylex';

import { MoreVerticalIcon } from '@/components/Icons';

import type { TableHeaderCellProps } from './TableHeaderCell.types';

import { tableHeaderCellStyles } from './TableHeaderCell.stylex';
import { getNextSortDirection } from './utils';
import { SortIcon } from './SortIcon';

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
    onSort(getNextSortDirection(sortDirection));
  };

  return (
    <th
      {...rest}
      {...stylex.props(
        tableHeaderCellStyles.base(minWidth, width),
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
    </th>
  );
};
