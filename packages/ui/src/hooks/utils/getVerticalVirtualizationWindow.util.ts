type GetVerticalVirtualizationWindowArgs = {
  readonly containerHeight: number;
  readonly itemHeight: number;
  readonly overscan: number;
  readonly scrollTop: number;
  readonly totalItems: number;
};

export const getVerticalVirtualizationWindow = ({
  containerHeight,
  itemHeight,
  overscan,
  scrollTop,
  totalItems,
}: GetVerticalVirtualizationWindowArgs) => {
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
