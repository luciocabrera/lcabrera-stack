import type { RefObject } from "react";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_COLUMN_OVERSCAN,
  DEFAULT_CONTAINER_WIDTH,
} from "@/constants/virtualization.constants";

import { findFirstOutOfViewIndex, findFirstVisibleIndex } from "./utils/index.ts";

/** Arguments for the useColumnVirtualization hook. */
export type UseColumnVirtualizationArgs = {
  /** Widths of the virtualized (non-pinned) columns in display order. */
  readonly columnWidths: readonly number[];
  /** Ref to the horizontally scrollable container element. */
  readonly containerRef: RefObject<HTMLElement | null>;
  /** Fallback container width used before the DOM is measured. Defaults to 1920; corrected immediately by the ResizeObserver after mount. */
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
  defaultContainerWidth = DEFAULT_CONTAINER_WIDTH,
  overscan = DEFAULT_COLUMN_OVERSCAN,
}: UseColumnVirtualizationArgs): UseColumnVirtualizationReturn => {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(() => {
    const measured = containerRef.current?.offsetWidth ?? 0;
    return measured > 0 ? measured : defaultContainerWidth;
  });
  const rafIdRef = useRef(-1);

  const cumulativeWidths = useMemo(() => {
    const cumulative: number[] = [];
    let totalWidth = 0;

    for (const width of columnWidths) {
      cumulative.push(totalWidth);
      totalWidth += width;
    }

    return { cumulative, totalWidth };
  }, [columnWidths]);

  useEffect(() => {
    const container = containerRef.current;

    const updateWidth = () => {
      const measured = container?.offsetWidth ?? 0;
      if (measured > 0) {
        // eslint-disable-next-line react-x/set-state-in-effect -- State must be set from DOM measurement (offsetWidth); cannot be derived during render
        setContainerWidth(measured);
      } else {
        // Container measured zero (e.g. CSS containment, flex sizing not yet resolved).
        // Fall back to the viewport width when it is also non-zero (real browser).
        // When innerWidth is 0 (jsdom, display:none) the old value is preserved.
        const vw = globalThis.window.innerWidth;
        if (vw > 0) {
          // eslint-disable-next-line react-x/set-state-in-effect -- Viewport width is a DOM measurement; cannot be derived during render
          setContainerWidth(vw);
        }
      }
    };

    const handleScroll = () => {
      if (rafIdRef.current >= 0) {
        return;
      }

      rafIdRef.current = globalThis.requestAnimationFrame(() => {
        rafIdRef.current = -1;
        // eslint-disable-next-line react-x/set-state-in-effect -- Scroll position must be read from DOM event; cannot be derived during render
        setScrollLeft(container?.scrollLeft ?? 0);
      });
    };

    const syncScrollPosition = () => {
      if (rafIdRef.current >= 0) {
        globalThis.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = -1;
      }

      // eslint-disable-next-line react-x/set-state-in-effect -- Scroll position must be read from DOM event; cannot be derived during render
      setScrollLeft(container?.scrollLeft ?? 0);
    };

    // Attempt an immediate measurement — succeeds when layout is already
    // resolved at effect time (e.g. unit tests with a pre-populated ref or
    // fast-path re-renders).
    updateWidth();

    // ResizeObserver fires after the browser finishes layout, including the
    // extra passes required by CSS containment / container-type:size on
    // ancestor elements. It covers both:
    //   • the initial mount when the immediate measurement returned 0, and
    //   • future container size changes (sidebar toggle, panel resize, etc.).
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    if (container) {
      resizeObserver.observe(container);
    }

    syncScrollPosition();
    container?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafIdRef.current >= 0) {
        globalThis.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = -1;
      }
      container?.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
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

  const { cumulative, totalWidth } = cumulativeWidths;

  const viewStart = scrollLeft;
  const viewEnd = scrollLeft + containerWidth;

  const firstVisibleIdx = findFirstVisibleIndex({
    starts: cumulative,
    viewStart,
    widths: columnWidths,
  });
  const startIndex =
    firstVisibleIdx >= totalColumns ? totalColumns : Math.max(0, firstVisibleIdx - overscan);

  const firstOutOfViewIdx = findFirstOutOfViewIndex({
    starts: cumulative,
    viewEnd,
  });
  const endIndex =
    firstOutOfViewIdx >= totalColumns
      ? totalColumns
      : Math.min(totalColumns, firstOutOfViewIdx + overscan);

  const leftSpacerWidth = cumulative[startIndex] ?? 0;
  const endSpacerStart = cumulative[endIndex] ?? totalWidth;
  const rightSpacerWidth = totalWidth - endSpacerStart;

  return {
    endIndex,
    leftSpacerWidth,
    rightSpacerWidth,
    startIndex,
    totalWidth,
  };
};
