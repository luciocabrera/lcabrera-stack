type GetTotalVisibleColumnCountArgs = {
  readonly leftPinnedCount: number;
  readonly leftSpacerWidth: number;
  readonly rightPinnedCount: number;
  readonly rightSpacerWidth: number;
  readonly visibleCenterCount: number;
};

/**
 * Computes the rendered column count used by spacer rows for their colSpan.
 */
export const getTotalVisibleColumnCount = ({
  leftPinnedCount,
  leftSpacerWidth,
  rightPinnedCount,
  rightSpacerWidth,
  visibleCenterCount,
}: GetTotalVisibleColumnCountArgs) =>
  leftPinnedCount +
  (leftSpacerWidth > 0 ? 1 : 0) +
  visibleCenterCount +
  (rightSpacerWidth > 0 ? 1 : 0) +
  rightPinnedCount;
