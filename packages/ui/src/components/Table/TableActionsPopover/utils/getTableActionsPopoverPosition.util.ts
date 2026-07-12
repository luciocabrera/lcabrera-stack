type BoundsRect = {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
};

type GetTableActionsPopoverPositionArgs = {
  readonly containerRect: BoundsRect;
  readonly horizontalNudgePx: number;
  readonly menuGapPx: number;
  readonly menuRect: BoundsRect;
  readonly triggerCellRight?: number;
  readonly triggerRect: BoundsRect;
  readonly viewportPaddingPx: number;
};

export const getTableActionsPopoverPosition = ({
  containerRect,
  horizontalNudgePx,
  menuGapPx,
  menuRect,
  triggerCellRight,
  triggerRect,
  viewportPaddingPx,
}: GetTableActionsPopoverPositionArgs) => {
  const spaceBelow = containerRect.bottom - triggerRect.bottom;
  const spaceAbove = triggerRect.top - containerRect.top;
  const requiredSpace = menuRect.height + viewportPaddingPx + menuGapPx;

  const shouldOpenAbove =
    (spaceBelow < requiredSpace && spaceAbove >= requiredSpace) ||
    (spaceBelow < requiredSpace && spaceAbove > spaceBelow);

  const nextTop = shouldOpenAbove
    ? triggerRect.top - menuRect.height - menuGapPx
    : triggerRect.bottom + menuGapPx;

  const minTop = containerRect.top + viewportPaddingPx;
  const maxTop = containerRect.bottom - menuRect.height - viewportPaddingPx;
  const top =
    maxTop < minTop ? minTop : Math.min(maxTop, Math.max(minTop, nextTop));

  const anchorRight = triggerCellRight ?? triggerRect.right;
  const alignedLeft = anchorRight - menuRect.width;
  const minLeft = containerRect.left + viewportPaddingPx;
  const maxLeft = containerRect.right - menuRect.width - viewportPaddingPx;

  const left =
    maxLeft < minLeft
      ? minLeft
      : Math.min(maxLeft, Math.max(minLeft, alignedLeft + horizontalNudgePx));

  return {
    left,
    top,
  };
};
