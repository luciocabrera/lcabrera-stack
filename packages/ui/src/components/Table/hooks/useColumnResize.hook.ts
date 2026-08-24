import type { DataKey } from '#ui/components/Table/Table.types';

import { useSetColumnSizing } from '#ui/components/Table/contexts/TableConfig/columns/actions';
import { resolveColumnWidthBounds } from '#ui/components/Table/utils';

import { useColumnDragSession } from './useColumnDragSession.hook';
import { resolveKeyboardResizeAction } from './utils/resolveKeyboardResizeAction.util';

type UseColumnResizeArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

export const useColumnResize = <TData>({
  columnKey,
  currentWidth,
  maxWidth,
  minWidth,
}: UseColumnResizeArgs<TData>) => {
  const setColumnSizing = useSetColumnSizing<TData>();
  const { isResizing, onMouseDown } = useColumnDragSession<TData>({
    columnKey,
    currentWidth,
    maxWidth,
    minWidth,
  });

  const bounds = resolveColumnWidthBounds({ maxWidth, minWidth });
  const width = currentWidth ?? bounds.minWidth;

  const onDoubleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setColumnSizing({ columnKey, width: undefined });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const action = resolveKeyboardResizeAction({
      currentWidth: width,
      isShiftPressed: event.shiftKey,
      key: event.key,
      maxWidth: bounds.maxWidth,
      minWidth: bounds.minWidth,
    });

    if (action.type === 'ignore') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setColumnSizing({
      columnKey,
      width: action.type === 'reset' ? undefined : action.width,
    });
  };

  return { bounds, isResizing, onDoubleClick, onKeyDown, onMouseDown, width };
};
