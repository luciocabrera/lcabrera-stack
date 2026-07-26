type CreateDraggableItemsArgs<TContent> = {
  readonly allOrderedColumns: readonly OrderedColumnItem[];
  readonly columnPinning: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
  readonly columnVisibility: ReadonlySet<string>;
  readonly renderItemContent: (args: {
    readonly columnKey: string;
    readonly isPinned: boolean;
    readonly isStatic: boolean;
    readonly isVisible: boolean;
    readonly label: string;
  }) => TContent;
};

type OrderedColumnItem = {
  readonly isStatic?: boolean;
  readonly key: string;
  readonly label: string;
};

export const createDraggableItems = <TContent>({
  allOrderedColumns,
  columnPinning,
  columnVisibility,
  renderItemContent,
}: CreateDraggableItemsArgs<TContent>) => {
  const leftPinned = new Set<string>(columnPinning.left);
  const rightPinned = new Set<string>(columnPinning.right);

  return allOrderedColumns.map((col) => {
    const isPinned = leftPinned.has(col.key) || rightPinned.has(col.key);
    const isStatic = col.isStatic === true;
    const isVisible = !columnVisibility.has(col.key);

    return {
      content: renderItemContent({
        columnKey: col.key,
        isPinned,
        isStatic,
        isVisible,
        label: col.label,
      }),
      id: col.key,
      isDraggable: !isStatic,
    };
  });
};
