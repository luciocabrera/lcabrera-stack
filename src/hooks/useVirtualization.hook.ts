import type { RefObject } from 'react';

import { useEffect, useState } from 'react';

export type UseVirtualizationArgs = {
  containerRef: RefObject<HTMLElement | null>;
  defaultContainerHeight?: number;
  itemHeight: number;
  overscan?: number;
  totalItems: number;
};

export const useVirtualization = ({
  containerRef,
  defaultContainerHeight = 400,
  itemHeight,
  overscan = 3,
  totalItems,
}: UseVirtualizationArgs) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    defaultContainerHeight,
  );

  useEffect(() => {
    const container = containerRef.current;

    const updateHeight = () => {
      setContainerHeight(container?.offsetHeight ?? defaultContainerHeight);
    };

    const handleScroll = () => {
      setScrollTop(container?.scrollTop ?? 0);
    };

    updateHeight();
    container?.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateHeight);

    return () => {
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateHeight);
    };
  }, [containerRef, defaultContainerHeight]);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems,
    startIndex + visibleCount + overscan * 2,
  );
  const offsetY = startIndex * itemHeight;
  const totalHeight = totalItems * itemHeight;
  const visibleItemsCount = endIndex - startIndex;
  const bottomSpacerHeight =
    totalHeight - (offsetY + visibleItemsCount * itemHeight);

  return {
    bottomSpacerHeight,
    endIndex,
    offsetY,
    startIndex,
    totalHeight,
    visibleCount,
  };
};
