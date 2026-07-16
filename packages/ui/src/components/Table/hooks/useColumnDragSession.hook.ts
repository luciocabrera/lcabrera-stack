import type { DataKey } from '@repo/ui/components/Table/Table.types';

import {
  useSetColumnSizingWithoutSync,
  useSyncColumnsSizing,
} from '@repo/ui/components/Table/contexts/TableConfig/columns/actions';
import { useEffect, useRef, useState } from 'react';

import { createResizeStartData } from './utils/createResizeStartData.util';
import { resolveResizeWidth } from './utils/resolveResizeWidth.util';

type UseColumnDragSessionArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

/**
 * The pointer half of a column resize. Private to `useColumnResize`, which is
 * the single entry point a component should use.
 *
 * Each mouse down opens a self-contained drag session: the start snapshot
 * (`createResizeStartData`), the RAF-throttled move handler emitting clamped
 * widths (`resolveResizeWidth`), and the paired teardown all live in one
 * closure. Unmount ends any in-flight session through `endDragSessionRef`.
 *
 * The gesture owns both halves of its own write: frames go through
 * `useSetColumnSizingWithoutSync` (store only, so a drag does not rewrite the
 * cookie at 60fps) and mouse up persists once.
 *
 * Features:
 * - Smooth resizing with requestAnimationFrame throttling
 * - Min/max width constraints
 * - Prevents text selection during drag
 * - Document-level mouse handlers for smooth drag outside element
 */
export const useColumnDragSession = <TData>({
  columnKey,
  currentWidth,
  maxWidth,
  minWidth,
}: UseColumnDragSessionArgs<TData>) => {
  const [isResizing, setIsResizing] = useState(false);
  const setColumnSizingWithoutSync = useSetColumnSizingWithoutSync<TData>();
  const syncColumnsSizing = useSyncColumnsSizing();
  const endDragSessionRef = useRef<(() => void) | undefined>(undefined);

  const onMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // A new drag always supersedes any session still in flight
    endDragSessionRef.current?.();

    const startData = createResizeStartData({
      clientX: event.clientX,
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
        setColumnSizingWithoutSync({ columnKey, width: pendingWidth });
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
      endDragSessionRef.current = undefined;
    };

    const handleMouseUp = () => {
      endDragSession();
      setIsResizing(false);

      // `endDragSession` just cancelled any frame still in flight, so flush its
      // width here. A quick drag delivers its last move and the release in the
      // same frame, and would otherwise be discarded — leaving the column at the
      // previous frame's width and persisting that instead of where it was let go.
      if (pendingWidth !== undefined) {
        setColumnSizingWithoutSync({ columnKey, width: pendingWidth });
      }

      syncColumnsSizing();
    };

    endDragSessionRef.current = endDragSession;
    setIsResizing(true);

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    document.addEventListener('mousemove', handleMouseMove, {
      signal: listenerController.signal,
    });
    document.addEventListener('mouseup', handleMouseUp, {
      signal: listenerController.signal,
    });
  };

  // End any in-flight drag session on unmount
  useEffect(() => {
    return () => {
      endDragSessionRef.current?.();
    };
  }, []);

  return { isResizing, onMouseDown };
};
