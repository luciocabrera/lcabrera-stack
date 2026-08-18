import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

type CreateDraggableItemsArgs<TContent> = {
  readonly allOrderedColumns: readonly OrderedColumnItem[];
  readonly columnPinning: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
  readonly columnVisibility: ReadonlySet<string>;
  /** The applied group keys — locked in place while grouping is applied. */
  readonly groupingKeys: readonly string[];
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

/**
 * **A group key is undraggable for its own reason, not by being static**
 * (ADR-080). While grouping is applied the keys are hoisted to the head of the
 * order and the left pin, so a drag would be silently undone on the next
 * derivation — and a gesture that visibly does nothing is worse than one
 * refused. `isStatic` is the wrong instrument for it: `resolveColumnCapabilities`
 * makes `isResizable` a veto of `isStatic`, and `TableHeaderActionsMenu`
 * computes `hasPinAndHide = !isStatic`, so borrowing the flag would also freeze
 * the key's width and strip its header menu. Resizing a rung cannot break a
 * staircase.
 */
export const createDraggableItems = <TContent>({
  allOrderedColumns,
  columnPinning,
  columnVisibility,
  groupingKeys,
  renderItemContent,
}: CreateDraggableItemsArgs<TContent>) => {
  const leftPinned = new Set<string>(columnPinning.left);
  const rightPinned = new Set<string>(columnPinning.right);
  const groupKeys = new Set<string>(groupingKeys);

  return allOrderedColumns.map((col) => {
    const isPinned = leftPinned.has(col.key) || rightPinned.has(col.key);
    const { isStatic } = resolveColumnCapabilities(col);
    const isGroupKey = groupKeys.has(col.key);
    const isVisible = !columnVisibility.has(col.key);

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
      isDraggable: !isStatic && !isGroupKey,
    };
  });
};
