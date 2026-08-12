import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnWidth,
  useGetNormalizedColumn,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useColumnResize } from '#ui/components/Table/hooks';
import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

import type { ResizeHandleProps } from './ResizeHandle.types';

import { resizeHandleStyles } from './ResizeHandle.stylex';

/**
 * Resize handle for a column, exposed as an ARIA window splitter
 * (`role="separator"` with a width value) rather than a button: it adjusts a
 * value, it does not invoke a command.
 *
 * `useColumnResize` owns every interaction and all the store wiring; this
 * component self-connects its own width and bounds from the store (columnKey +
 * columnLabel are all it takes) and only spreads what the hook returns onto the
 * host element.
 */
export const ResizeHandle = <TData,>({
  columnKey,
  columnLabel,
}: ResizeHandleProps<TData>) => {
  const { maxWidth, minWidth } = useGetNormalizedColumn<TData>(columnKey);
  const storedWidth = useGetColumnWidth<TData>(columnKey);
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
  const currentWidth = storedWidth ?? effectiveMinWidth;

  const { bounds, isResizing, onDoubleClick, onKeyDown, onMouseDown, width } =
    useColumnResize<TData>({
      columnKey,
      currentWidth,
      maxWidth,
      minWidth: effectiveMinWidth,
    });

  return (
    <div
      aria-label={`Resize ${columnLabel} column`}
      aria-orientation='vertical'
      aria-valuemax={bounds.maxWidth}
      aria-valuemin={bounds.minWidth}
      aria-valuenow={width}
      aria-valuetext={`${width} pixels`}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      role='separator'
      tabIndex={0}
      {...stylex.props(
        resizeHandleStyles.resizeHandle,
        isResizing && resizeHandleStyles.resizeHandleActive,
      )}
    />
  );
};
