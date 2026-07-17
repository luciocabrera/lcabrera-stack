import type { ColumnSizingArgs } from '@repo/ui/components/Table/contexts/TableConfig/columns/actions/useSetColumnSizingWithoutSync.hook';
import type { DataKey } from '@repo/ui/components/Table/Table.types';

import { createResizeStartData } from './createResizeStartData.util';
import { resolveResizeWidth } from './resolveResizeWidth.util';

type StartColumnResizeSessionArgs<TData> = {
  /** Pointer position the gesture started from */
  readonly clientX: number;
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  /** Runs on mouse up only — not when the session is torn down by unmount */
  readonly onGestureEnd: () => void;
  /** Runs on every teardown path: mouse up, unmount, or a superseding drag */
  readonly onSessionEnd: () => void;
  /** Store-only width write, called once per animation frame */
  readonly setColumnWidth: (args: ColumnSizingArgs<TData>) => void;
  /** Persists the final width once the gesture is over */
  readonly syncColumnWidth: () => void;
};

/**
 * Opens a self-contained column-resize drag session and returns its teardown.
 *
 * Owns the side effects a resize gesture needs — document-level listeners,
 * `requestAnimationFrame` throttling, and the body styles that suppress text
 * selection — so `useColumnDragSession` stays a thin pointer-state hook.
 *
 * Frames go through `setColumnWidth` (store only, so a drag does not rewrite
 * the cookie at 60fps); `syncColumnWidth` persists once on release.
 *
 * @returns The session teardown. Safe to call from any path — it cancels the
 * in-flight frame, removes the listeners, and restores the body styles.
 */
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
