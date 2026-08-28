import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

type CreateDraggableItemsArgs<TContent> = {
  readonly allOrderedColumns: readonly OrderedColumnItem[];
  readonly columnPinning: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
  /** The applied group keys — locked in place while grouping is applied. */
  readonly groupingKeys: readonly string[];
  /** The declared keys the grid paints, which is what `Show` reflects (ADR-095). */
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

/**
 * **A group key is undraggable for its own reason, not by being static** (ADR-080), and
 * while grouping is applied so is every other row: the order shown is the grid's derived
 * one, so a drag would write a derivation into the persisted order (ADR-095).
 * A gesture the derivation would undo is refused rather than accepted.
 * Resizing a rung cannot break a staircase.
 */
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
