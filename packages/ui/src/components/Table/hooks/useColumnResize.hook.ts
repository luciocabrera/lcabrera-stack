import type { DataKey } from '@repo/ui/components/Table/Table.types';

import { useSetColumnSizing } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { resolveColumnWidthBounds } from '@repo/ui/components/Table/utils';

import { useColumnDragSession } from './useColumnDragSession.hook';
import { resolveKeyboardResizeAction } from './utils/resolveKeyboardResizeAction.util';

type UseColumnResizeArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

/**
 * Everything needed to resize one column: every handler, and the value and
 * bounds a splitter has to announce. The single owner of resize store wiring —
 * a component spreads what it returns and triggers no actions of its own.
 *
 * Pointer drag is delegated to `useColumnDragSession`, which previews per frame
 * and persists once at mouse up. A keypress and a double-click are complete
 * interactions, so they go straight through `useSetColumnSizing`, which
 * persists on its own.
 *
 * @example
 * ```tsx
 * const { bounds, isResizing, onDoubleClick, onKeyDown, onMouseDown, width } =
 *   useColumnResize<TData>({
 *     columnKey: column.key,
 *     currentWidth: columnSizing[column.key],
 *     maxWidth: column.maxWidth,
 *     minWidth: column.minWidth,
 *   });
 * ```
 */
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
