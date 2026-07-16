import { useEffect, useRef, useState } from 'react';

import { useSyncColumnsSizing } from '../contexts/TableConfig/columns/actions/useSyncColumnsSizing.hook';
import { createResizeStartData } from './utils/createResizeStartData.util';
import { resolveResizeWidth } from './utils/resolveResizeWidth.util';

export type OnResizeParams = {
  readonly columnKey: string;
  readonly width: number;
};

export type UseColumnResizeArgs = {
  readonly columnKey: string;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly onResize: (params: OnResizeParams) => void;
};

/**
 * Hook for handling column resize with mouse drag.
 *
 * Each mouse down opens a self-contained drag session: the start snapshot
 * (`createResizeStartData`), the RAF-throttled move handler emitting clamped
 * widths (`resolveResizeWidth`), and the paired teardown all live in one
 * closure. Mouse up ends the session and persists via `useSyncColumnsSizing`;
 * unmount ends any in-flight session through `endDragSessionRef`.
 *
 * Features:
 * - Smooth resizing with requestAnimationFrame throttling
 * - Min/max width constraints
 * - Prevents text selection during drag
 * - Document-level mouse handlers for smooth drag outside element
 *
 * @example
 * ```tsx
 * const { onMouseDown, isResizing } = useColumnResize({
 *   columnKey: column.key,
 *   currentWidth: columnSizing[column.key],
 *   minWidth: column.minWidth,
 *   maxWidth: column.maxWidth,
 *   onResize: ({ columnKey, width }) => setColumnSizing(columnKey, width),
 * });
 * ```
 */
export const useColumnResize = ({
  columnKey,
  currentWidth,
  maxWidth,
  minWidth,
  onResize,
}: UseColumnResizeArgs) => {
  const [isResizing, setIsResizing] = useState(false);
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

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Keep only the latest pending frame so moves render at most once per frame
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        onResize({
          columnKey,
          width: resolveResizeWidth({
            clientX: moveEvent.clientX,
            ...startData,
          }),
        });
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
