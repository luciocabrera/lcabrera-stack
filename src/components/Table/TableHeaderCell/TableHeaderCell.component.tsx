import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
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
import {
  useSetTableColumnSelectedKey,
  useToogleTableIsColumnSettingsOpen,
} from '../contexts/TableConfig/meta/actions';
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
  ...rest
}: TableHeaderCellProps<TData>) => {
  useRenderTracker({ componentName: `TableHeaderCell:${columnKey}` });

  const columnSizing = useGetColumnSizing();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();

  const setColumnSizing = useSetColumnSizing();
  const setSorting = useSetColumnSorting();
  const setTableColumnSelectedKey = useSetTableColumnSelectedKey();
  const toogleTableIsColumnSettingsOpen = useToogleTableIsColumnSettingsOpen();

  const { label, maxWidth, minWidth } = column;
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const currentWidth = columnSizing[column.key] ?? effectiveMinWidth;
  const sortDirection = column.sortDirection;
  const isSortable = column.isSortable !== false;
  const isLoadingState = isLoading || isLoadingMore;

  const { isResizing, onMouseDown } = useColumnResize({
    columnKey,
    currentWidth,
    maxWidth,
    minWidth: effectiveMinWidth,
    onResize: setColumnSizing,
  });

  const handleSort = () => {
    if (!isSortable) return;
    const nextDirection = getNextSortDirection(sortDirection);
    setSorting({ columnKey, direction: nextDirection });
  };

  const handleOpenSettings = () => {
    setTableColumnSelectedKey(columnKey);
    toogleTableIsColumnSettingsOpen();
  };

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
          <Button
            aria-label={`Sort by ${label}`}
            color='ghost'
            customStylex={tableHeaderCellStyles.settingsButton}
            icon={<SortIcon direction={sortDirection} />}
            onClick={handleSort}
            size='embedded'
          />
        )}
        {hasSettings && (
          <Button
            aria-label={`Settings for ${label}`}
            color='ghost'
            customStylex={tableHeaderCellStyles.settingsButton}
            icon={<MoreVerticalIcon size={14} />}
            onClick={handleOpenSettings}
            size='embedded'
          />
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
