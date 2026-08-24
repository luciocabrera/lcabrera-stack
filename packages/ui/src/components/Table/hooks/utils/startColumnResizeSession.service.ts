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
  /** Runs on mouse up only — not when the session is torn down by unmount */
  readonly onGestureEnd: () => void;
  /** Runs on every teardown path: mouse up, unmount, or a superseding drag */
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
  // The most recent width no frame has written to the store yet.
  let pendingWidth: number | undefined;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    pendingWidth = resolveResizeWidth({
      clientX: moveEvent.clientX,
      ...startData,
    });

    // Keep only the latest pending frame so moves render at most once per frame
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

    // `endDragSession` just cancelled any frame still in flight, so flush its
    // width here. A quick drag delivers its last move and the release in the
    // same frame, and would otherwise be discarded — leaving the column at the
    // previous frame's width and persisting that instead of where it was let go.
    if (pendingWidth !== undefined) {
      setColumnWidth({ columnKey, width: pendingWidth });
    }

    syncColumnWidth();
  };

  // Prevent text selection during drag
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
