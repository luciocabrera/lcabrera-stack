import { useEffect, useState } from 'react';

type UseSkeletonRowCountArgs = {
  /** Reference to the container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Fallback row count when container is not available */
  fallbackRowCount?: number;
  /** Height of each row in pixels */
  rowHeight: number;
};

/**
 * Calculate the number of skeleton rows to render based on container height
 *
 * Uses ResizeObserver to dynamically update when container size changes.
 * Falls back to a default count when container is not yet available.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const skeletonRowCount = useSkeletonRowCount({
 *   containerRef,
 *   rowHeight: 40,
 *   fallbackRowCount: 10,
 * });
 * ```
 */
export const useSkeletonRowCount = ({
  containerRef,
  fallbackRowCount = 10,
  rowHeight,
}: UseSkeletonRowCountArgs): number => {
  const [rowCount, setRowCount] = useState(fallbackRowCount);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateRowCount = () => {
      const containerHeight = container.clientHeight;
      if (containerHeight > 0 && rowHeight > 0) {
        // Add 1 to ensure we fill the container even with partial rows
        const calculatedCount = Math.ceil(containerHeight / rowHeight) + 1;
        setRowCount(calculatedCount);
      }
    };

    // Initial calculation
    calculateRowCount();

    // Observe size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateRowCount();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, rowHeight]);

  return rowCount;
};
