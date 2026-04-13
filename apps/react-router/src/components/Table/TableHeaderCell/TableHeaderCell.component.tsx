import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { PinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';
import type { PinConflictState, PinSide } from '@/types/ui.types';

import { Button } from '@/components/Button';
import { MoreVerticalIcon, PinIcon, PinOffIcon } from '@/components/Icons';
import { PinSideModal } from '@/components/PinSideModal';
import {
  useAcceptHeaderPinConflict,
  useAcceptHeaderPinSide,
  useSetColumnPinning,
  useSetColumnSizing,
  useSetColumnSorting,
} from '@/components/Table/contexts/TableConfig/columns/actions';
import { useColumnResize } from '@/components/Table/hooks';
import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';
import { PinConflictModal } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/PinConflictModal';
import { useRenderTracker } from '@/utils/performance';

import type { TableHeaderCellProps } from './TableHeaderCell.types.ts';

import {
  useGetColumnSizing,
  useGetNormalizedColumn,
} from '../contexts/TableConfig/columns/selectors/index.ts';
import {
  useSetTableColumnSelectedKey,
  useToogleTableIsColumnSettingsOpen,
} from '../contexts/TableConfig/meta/actions/index.ts';
import { SortIcon } from './SortIcon/index.ts';
import {
  skeletonStyles,
  tableHeaderCellStyles,
} from './TableHeaderCell.stylex.ts';
import {
  getNextSortDirection,
  getPinnedStyle,
  getShadowStyle,
} from './utils/index.ts';

export const TableHeaderCell = <TData extends Record<string, unknown>>({
  columnKey,
  customStylex,
  hasSettings = false,
  isLoadingState = false,
  pinInfo,
  ...rest
}: TableHeaderCellProps<TData>) => {
  useRenderTracker({ componentName: `TableHeaderCell:${columnKey}` });

  const columnSizing = useGetColumnSizing<TData>();
  const column = useGetNormalizedColumn<TData>(columnKey);

  const setColumnSizing = useSetColumnSizing<TData>();
  const setColumnPinning = useSetColumnPinning<TData>();
  const setSorting = useSetColumnSorting<TData>();
  const setTableColumnSelectedKey = useSetTableColumnSelectedKey();
  const toogleTableIsColumnSettingsOpen = useToogleTableIsColumnSettingsOpen();
  const acceptHeaderPinSide = useAcceptHeaderPinSide<TData>();
  const acceptHeaderPinConflict = useAcceptHeaderPinConflict<TData>();

  const [isPinSideModalOpen, setIsPinSideModalOpen] = useState(false);
  const [pinConflict, setPinConflict] = useState<PinConflictState>({
    isOpen: false,
    side: 'left',
  });

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
    toogleTableIsColumnSettingsOpen();
  };

  const handleResizeDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setColumnSizing({ columnKey, width: undefined });
  };

  const handlePinClick = () => {
    if (pinInfo?.side) {
      setColumnPinning({ columnKey, side: undefined });
    } else {
      setIsPinSideModalOpen(true);
    }
  };

  const handlePinAccept = (pinSide: PinSide) => {
    const conflict = acceptHeaderPinSide({ columnKey, pinSide });
    if (conflict) setPinConflict(conflict);
    setIsPinSideModalOpen(false);
  };

  const handlePinCancel = () => {
    setIsPinSideModalOpen(false);
  };

  const handlePinConflictAccept = (resolution: PinConflictResolution) => {
    acceptHeaderPinConflict({ columnKey, resolution, side: pinConflict.side });
    setPinConflict({ isOpen: false, side: 'left' });
  };

  const handlePinConflictCancel = () => {
    setPinConflict({ isOpen: false, side: 'left' });
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
                onAccept={handlePinAccept}
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
        </>
      )}
    </th>
  );
};
