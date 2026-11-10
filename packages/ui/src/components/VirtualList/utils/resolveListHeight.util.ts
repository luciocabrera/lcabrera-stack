type ResolveListHeightArgs = {
  readonly hasSelectAll: boolean;
  readonly itemHeight: number;
  readonly listMaxHeight: string;
  readonly loadedCount: number;
};

export const resolveListHeight = ({
  hasSelectAll,
  itemHeight,
  listMaxHeight,
  loadedCount,
}: ResolveListHeightArgs) => {
  if (loadedCount === 0) return listMaxHeight;

  const rowCount =
    hasSelectAll && loadedCount >= 2 ? loadedCount + 1 : loadedCount;

  return `min(${listMaxHeight}, ${rowCount * itemHeight}px)`;
};
