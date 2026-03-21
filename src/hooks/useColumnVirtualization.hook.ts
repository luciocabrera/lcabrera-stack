import type { RefObject } from 'react';

import { useEffect, useState } from 'react';

/** Arguments for the useColumnVirtualization hook. */
export type UseColumnVirtualizationArgs = {
  /** Widths of the virtualized (non-pinned) columns in display order. */
  readonly columnWidths: readonly number[];
  /** Ref to the horizontally scrollable container element. */
  readonly containerRef: RefObject<HTMLElement | null>;
  /** Fallback container width used before the DOM is measured. Default: 800. */
  readonly defaultContainerWidth?: number;
  /** Extra columns rendered beyond each edge of the visible window. Default: 2. */
  readonly overscan?: number;
};

/** Return type of the useColumnVirtualization hook. */
export type UseColumnVirtualizationReturn = {
  /** End index (exclusive) in the columnWidths array for the rendered window. */
  readonly endIndex: number;
  /** Pixel width of the spacer cell inserted before the rendered window. */
  readonly leftSpacerWidth: number;
  /** Pixel width of the spacer cell inserted after the rendered window. */
  readonly rightSpacerWidth: number;
  /** Start index (inclusive) in the columnWidths array for the rendered window. */
  readonly startIndex: number;
  /** Sum of all column widths. */
  readonly totalWidth: number;
};

/**
 * Computes the horizontal virtual-scroll window for a set of columns.
 *
 * Tracks `scrollLeft` and `offsetWidth` of the container to determine which
 * columns are currently visible. Returns the slice indices and spacer widths
 * needed to render only the visible columns while maintaining correct layout.
 *
 * Pinned columns are handled by the caller — this hook operates only on the
 * non-pinned (center) column set.
 */
export const useColumnVirtualization = ({
  columnWidths,
  containerRef,
  defaultContainerWidth = 800,
  overscan = 2,
}: UseColumnVirtualizationArgs): UseColumnVirtualizationReturn => {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(defaultContainerWidth);

  useEffect(() => {
    const container = containerRef.current;

    const updateWidth = () => {
      const measured = container?.offsetWidth ?? 0;
      // Skip zero measurements (e.g. display:none) to preserve last valid width
      if (measured > 0) {
        // eslint-disable-next-line react-x/set-state-in-effect -- State must be set from DOM measurement (offsetWidth); cannot be derived during render
        setContainerWidth(measured);
      }
    };

    const handleScroll = () => {
      // eslint-disable-next-line react-x/set-state-in-effect -- Scroll position must be read from DOM event; cannot be derived during render
      setScrollLeft(container?.scrollLeft ?? 0);
    };

    updateWidth();
    container?.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateWidth);

    return () => {
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateWidth);
    };
  }, [containerRef]);

  const totalColumns = columnWidths.length;

  if (totalColumns === 0) {
    return {
      endIndex: 0,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
      startIndex: 0,
      totalWidth: 0,
    };
  }

  // Build cumulative start-position for each column: cumulativeWidths[i] is the
  // pixel offset at which column i begins.
  const cumulativeWidths: number[] = [];
  let totalWidth = 0;
  for (const width of columnWidths) {
    cumulativeWidths.push(totalWidth);
    totalWidth += width;
  }

  const viewStart = scrollLeft;
  const viewEnd = scrollLeft + containerWidth;

  // First column whose right edge exceeds viewStart (partially or fully visible)
  const firstVisibleIdx = cumulativeWidths.findIndex((colStart, i) => {
    const colWidth = columnWidths[i] ?? 0;
    return colStart + colWidth > viewStart;
  });

  const startIndex =
    firstVisibleIdx === -1
      ? totalColumns
      : Math.max(0, firstVisibleIdx - overscan);

  // First column whose left edge is past viewEnd (fully scrolled off right)
  const firstOutOfViewIdx = cumulativeWidths.findIndex(
    (colStart) => colStart >= viewEnd,
  );

  const endIndex =
    firstOutOfViewIdx === -1
      ? totalColumns
      : Math.min(totalColumns, firstOutOfViewIdx + overscan);

  const leftSpacerWidth = cumulativeWidths[startIndex] ?? 0;
  const endSpacerStart = cumulativeWidths[endIndex] ?? totalWidth;
  const rightSpacerWidth = totalWidth - endSpacerStart;

  return {
    endIndex,
    leftSpacerWidth,
    rightSpacerWidth,
    startIndex,
    totalWidth,
  };
};
