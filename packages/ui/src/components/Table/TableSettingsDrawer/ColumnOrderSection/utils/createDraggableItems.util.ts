import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

type CreateDraggableItemsArgs<TContent> = {
  readonly allOrderedColumns: readonly OrderedColumnItem[];
  readonly columnPinning: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
  /** The applied group keys — locked in place while grouping is applied. */
  readonly groupingKeys: readonly string[];
  readonly renderedColumnKeys: ReadonlySet<string>;
  readonly renderItemContent: (args: {
    readonly columnKey: string;
    readonly isGroupKey: boolean;
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

/** Undraggable is its own flag, never `isStatic` (ADR-080, ADR-095). */
export const createDraggableItems = <TContent>({
  allOrderedColumns,
  columnPinning,
  groupingKeys,
  renderedColumnKeys,
  renderItemContent,
}: CreateDraggableItemsArgs<TContent>) => {
  const leftPinned = new Set<string>(columnPinning.left);
  const rightPinned = new Set<string>(columnPinning.right);
  const groupKeys = new Set<string>(groupingKeys);
  const isGrouped = groupingKeys.length > 0;

  return allOrderedColumns.map((col) => {
    const isPinned = leftPinned.has(col.key) || rightPinned.has(col.key);
    const { isStatic } = resolveColumnCapabilities(col);
    const isGroupKey = groupKeys.has(col.key);
    const isVisible = renderedColumnKeys.has(col.key);

    return {
      content: renderItemContent({
        columnKey: col.key,
        isGroupKey,
        isPinned,
        isStatic,
        isVisible,
        label: col.label,
      }),
      id: col.key,
      isDraggable: !isStatic && !isGrouped,
    };
  });
};
