import { Button } from '@repo/ui/components/Button';
import {
  MoreVerticalIcon,
  PinIcon,
  PinOffIcon,
} from '@repo/ui/components/Icons';
import { PinSideModal } from '@repo/ui/components/PinSideModal';
import {
  useSetColumnSizing,
  useSetColumnSorting,
} from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { useColumnResize } from '@repo/ui/components/Table/hooks';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@repo/ui/components/Table/Table.constants';
import { PinConflictModal } from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/PinConflictModal';
import * as stylex from '@stylexjs/stylex';

import type { TableHeaderCellProps } from './TableHeaderCell.types';

import {
  useGetColumnSizing,
  useGetNormalizedColumn,
} from '../contexts/TableConfig/columns/selectors';
import {
  useSetTableColumnSelectedKey,
  useSetTableDrawersOpenState,
} from '../contexts/TableConfig/meta/actions';
import { useTableHeaderPinFlow } from './hooks';
import { SortIcon } from './SortIcon';
import {
  skeletonStyles,
  tableHeaderCellStyles,
} from './TableHeaderCell.stylex';
import { getNextSortDirection, getPinnedStyle, getShadowStyle } from './utils';

export const TableHeaderCell = <TData extends Record<string, unknown>>({
  columnKey,
  customStylex,
  hasSettings = false,
  isLoadingState = false,
  pinInfo,
  ...rest
}: TableHeaderCellProps<TData>) => {
  const columnSizing = useGetColumnSizing<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);

  const setColumnSizing = useSetColumnSizing<TData>();
  const setSorting = useSetColumnSorting<TData>();
  const setTableColumnSelectedKey = useSetTableColumnSelectedKey();
  const setTableDrawersOpenState = useSetTableDrawersOpenState();

  const {
    handlePinCancel,
    handlePinClick,
    handlePinConflictAccept,
    handlePinConflictCancel,
    handlePinSideAccept,
    isPinSideModalOpen,
    pinConflict,
  } = useTableHeaderPinFlow<TData>({ columnKey, pinInfo });

  const { isHeaderHidden, label, maxWidth, minWidth } = column;
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const currentWidth = columnSizing[column.key] ?? effectiveMinWidth;
  const sortDirection = column.sortDirection;
  const isSortable = column.isSortable !== false;
  const isResizable = column.isResizable !== false && !column.isStatic;
  const isStatic = column.isStatic === true;

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
    setTableDrawersOpenState({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
    });
  };

  const handleResizeDoubleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setColumnSizing({ columnKey, width: undefined });
  };

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
      {isLoadingState && (
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      )}
      {!isHeaderHidden && (
        <>
          <span {...stylex.props(tableHeaderCellStyles.content)}>{label}</span>
          <div {...stylex.props(tableHeaderCellStyles.controls)}>
            {!isStatic && (
              <Button
                aria-label={pinInfo?.side ? `Unpin ${label}` : `Pin ${label}`}
                color='ghost'
                customStylex={tableHeaderCellStyles.settingsButton}
                icon={
                  pinInfo?.side ? (
                    <PinIcon size={14} />
                  ) : (
                    <PinOffIcon size={14} />
                  )
                }
                onClick={handlePinClick}
                size='embedded'
              />
            )}
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
          {!isStatic && (
            <>
              <PinSideModal
                columnLabel={label}
                isOpen={isPinSideModalOpen}
                onAccept={handlePinSideAccept}
                onCancel={handlePinCancel}
              />
              <PinConflictModal
                columnLabel={label}
                isOpen={pinConflict.isOpen}
                onAccept={handlePinConflictAccept}
                onCancel={handlePinConflictCancel}
                side={pinConflict.side}
              />
            </>
          )}
          {/* Resize handle */}
          {isResizable && (
            <button
              aria-label={`Resize ${label} column`}
              onDoubleClick={handleResizeDoubleClick}
              onMouseDown={onMouseDown}
              type='button'
              {...stylex.props(tableHeaderCellStyles.resizeHandle)}
            >
              <div
                {...stylex.props(
                  tableHeaderCellStyles.resizeHandleLine,
                  isResizing && tableHeaderCellStyles.resizeHandleActive,
                )}
              />
            </button>
          )}
        </>
      )}
    </th>
  );
};
