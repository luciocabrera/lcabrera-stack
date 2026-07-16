import { useColumnResize } from '@repo/ui/components/Table/hooks';
import * as stylex from '@stylexjs/stylex';

import type { ResizeHandleProps } from './ResizeHandle.types';

import { resizeHandleStyles } from './ResizeHandle.stylex';

/**
 * Resize handle for a column, exposed as an ARIA window splitter
 * (`role="separator"` with a width value) rather than a button: it adjusts a
 * value, it does not invoke a command.
 *
 * `useColumnResize` owns every interaction and all the store wiring; this
 * component only spreads what it returns onto the host element.
 */
export const ResizeHandle = <TData,>({
  columnKey,
  columnLabel,
  currentWidth,
  maxWidth,
  minWidth,
}: ResizeHandleProps<TData>) => {
  const { bounds, isResizing, onDoubleClick, onKeyDown, onMouseDown, width } =
    useColumnResize<TData>({ columnKey, currentWidth, maxWidth, minWidth });

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
