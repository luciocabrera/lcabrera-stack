import type { ColumnSizingArgs } from '#ui/components/Table/contexts/TableConfig/columns/actions/useSetColumnSizingWithoutSync.hook';
import type { DataKey } from '#ui/components/Table/Table.types';

import { createResizeStartData } from './createResizeStartData.util';
import { resolveResizeWidth } from './resolveResizeWidth.util';

type StartColumnResizeSessionArgs<TData> = {
  readonly clientX: number;
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly onGestureEnd: () => void;
  readonly onSessionEnd: () => void;
  readonly setColumnWidth: (args: ColumnSizingArgs<TData>) => void;
  readonly syncColumnWidth: () => void;
};

export const startColumnResizeSession = <TData>({
  clientX,
  columnKey,
  currentWidth,
  maxWidth,
  minWidth,
  onGestureEnd,
  onSessionEnd,
  setColumnWidth,
  syncColumnWidth,
}: StartColumnResizeSessionArgs<TData>) => {
  const startData = createResizeStartData({
    clientX,
    currentWidth,
    maxWidth,
    minWidth,
  });
  const listenerController = new AbortController();
  let animationFrameId: number | undefined;
  let pendingWidth: number | undefined;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    pendingWidth = resolveResizeWidth({
      clientX: moveEvent.clientX,
      ...startData,
    });

    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(() => {
      setColumnWidth({ columnKey, width: pendingWidth });
      animationFrameId = undefined;
      pendingWidth = undefined;
    });
  };

  const endDragSession = () => {
    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }
    listenerController.abort();
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    onSessionEnd();
  };

  const handleMouseUp = () => {
    endDragSession();
    onGestureEnd();

    if (pendingWidth !== undefined) {
      setColumnWidth({ columnKey, width: pendingWidth });
    }

    syncColumnWidth();
  };

  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';

  document.addEventListener('mousemove', handleMouseMove, {
    signal: listenerController.signal,
  });
  document.addEventListener('mouseup', handleMouseUp, {
    signal: listenerController.signal,
  });

  return endDragSession;
};
