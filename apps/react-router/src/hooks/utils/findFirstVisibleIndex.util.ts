type FindFirstVisibleIndexArgs = {
  readonly starts: readonly number[];
  readonly viewStart: number;
  readonly widths: readonly number[];
};

/**
 * Finds the first column index whose right edge is beyond the viewport start.
 */
export const findFirstVisibleIndex = ({
  starts,
  viewStart,
  widths,
}: FindFirstVisibleIndexArgs): number => {
  let low = 0;
  let high = starts.length - 1;
  let result = starts.length;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midStart = starts[mid] ?? 0;
    const midWidth = widths[mid] ?? 0;

    if (midStart + midWidth > viewStart) {
      result = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
};
