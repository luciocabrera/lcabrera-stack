import * as stylex from '@stylexjs/stylex';

import {
  useGetColumnWidth,
  useGetNormalizedColumn,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useColumnResize } from '#ui/components/Table/hooks';
import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

import type { ResizeHandleProps } from './ResizeHandle.types';

import { resizeHandleStyles } from './ResizeHandle.stylex';

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
      tabIndex={-1}
      {...stylex.props(
        resizeHandleStyles.resizeHandle,
        isResizing && resizeHandleStyles.resizeHandleActive,
      )}
    />
  );
};
