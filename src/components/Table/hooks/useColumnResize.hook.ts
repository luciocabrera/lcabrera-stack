import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
} from '@/components/Table/Table.constants';

export type OnResizeParams = {
  columnKey: string;
  width: number;
};

export type UseColumnResizeArgs = {
  columnKey: string;
  currentWidth: number | undefined;
  maxWidth?: number;
  minWidth?: number;
  onResize: (params: OnResizeParams) => void;
};

/**
 * Hook for handling column resize with mouse drag
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
  const resizeDataRef = useRef<
    | undefined
    | {
        animationFrameId: number | undefined;
        initialWidth: number;
        initialX: number;
        maxWidth: number;
        minWidth: number;
      }
  >(undefined);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!resizeDataRef.current) return;

      const { animationFrameId, initialWidth, initialX, maxWidth, minWidth } =
        resizeDataRef.current;

      // Cancel previous animation frame
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }

      // Use RAF to throttle updates for smooth performance
      const newAnimationFrameId = requestAnimationFrame(() => {
        const delta = event.clientX - initialX;
        const newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, initialWidth + delta),
        );

        onResize({ columnKey, width: newWidth });
      });

      resizeDataRef.current.animationFrameId = newAnimationFrameId;
    },
    [columnKey, onResize],
  );

  const handleMouseUp = useCallback(() => {
    const animationFrameId = resizeDataRef.current?.animationFrameId;
    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
    }

    resizeDataRef.current = undefined;
    setIsResizing(false);

    // Re-enable text selection
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
      const effectiveMaxWidth = maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH;
      const effectiveCurrentWidth = currentWidth ?? effectiveMinWidth;

      resizeDataRef.current = {
        animationFrameId: undefined,
        initialWidth: effectiveCurrentWidth,
        initialX: event.clientX,
        maxWidth: effectiveMaxWidth,
        minWidth: effectiveMinWidth,
      };

      setIsResizing(true);

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      // Add document-level event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [currentWidth, handleMouseMove, handleMouseUp, maxWidth, minWidth],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const animationFrameId = resizeDataRef.current?.animationFrameId;
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return { isResizing, onMouseDown };
};
