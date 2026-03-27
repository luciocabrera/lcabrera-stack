import type { RefObject } from "react";

import { useEffect, useState } from "react";

import {
  DEFAULT_CONTAINER_HEIGHT,
  DEFAULT_ROW_OVERSCAN,
} from "@/constants/virtualization.constants";

export type UseVirtualizationArgs = {
  readonly containerRef: RefObject<HTMLElement | null>;
  readonly defaultContainerHeight?: number;
  readonly itemHeight: number;
  readonly overscan?: number;
  readonly totalItems: number;
};

export const useVirtualization = ({
  containerRef,
  defaultContainerHeight = DEFAULT_CONTAINER_HEIGHT,
  itemHeight,
  overscan = DEFAULT_ROW_OVERSCAN,
  totalItems,
}: UseVirtualizationArgs) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(defaultContainerHeight);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * itemHeight;
  const totalHeight = totalItems * itemHeight;
  const visibleItemsCount = endIndex - startIndex;
  const bottomSpacerHeight = totalHeight - (offsetY + visibleItemsCount * itemHeight);

  useEffect(() => {
    const container = containerRef.current;

    const updateHeight = () => {
      const measured = container?.offsetHeight ?? 0;
      // Skip zero measurements (e.g. display:none from Activity hidden)
      // to preserve the last valid height and avoid layout shifts
      if (measured > 0) {
        // eslint-disable-next-line react-x/set-state-in-effect -- State must be set from DOM measurement (offsetHeight); this cannot be derived during render
        setContainerHeight(measured);
      }
    };

    const handleScroll = () => {
      setScrollTop(container?.scrollTop ?? 0);
    };

    updateHeight();
    container?.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateHeight);

    return () => {
      container?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeight);
    };
  }, [containerRef, defaultContainerHeight]);

  return {
    bottomSpacerHeight,
    containerHeight,
    endIndex,
    offsetY,
    startIndex,
    totalHeight,
    visibleCount,
  };
};
