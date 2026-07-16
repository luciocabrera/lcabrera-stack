import type { DataKey } from '@repo/ui/components/Table/Table.types';

import { useSetColumnSizing } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { useColumnResize } from '@repo/ui/components/Table/hooks';
import * as stylex from '@stylexjs/stylex';

import type { ResizeHandleProps } from './ResizeHandle.types';

import { resizeHandleStyles } from './ResizeHandle.stylex';

export const ResizeHandle = <TData,>({
  columnKey,
  columnLabel,
  currentWidth,
  maxWidth,
  minWidth,
}: ResizeHandleProps<TData>) => {
  const setColumnSizing = useSetColumnSizing<TData>();

  const { isResizing, onMouseDown } = useColumnResize({
    columnKey,
    currentWidth,
    maxWidth,
    minWidth,
    onResize: (params) => {
      setColumnSizing({
        columnKey: params.columnKey as DataKey<TData>,
        width: params.width,
      });
    },
  });

  const handleDoubleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setColumnSizing({ columnKey, width: undefined });
  };

  return (
    <button
      aria-label={`Resize ${columnLabel} column`}
      onDoubleClick={handleDoubleClick}
      onMouseDown={onMouseDown}
      type='button'
      {...stylex.props(
        resizeHandleStyles.resizeHandle,
        isResizing && resizeHandleStyles.resizeHandleActive,
      )}
    />
  );
};
