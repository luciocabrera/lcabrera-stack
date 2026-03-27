type FindFirstOutOfViewIndexArgs = {
  readonly starts: readonly number[];
  readonly viewEnd: number;
};

/**
 * Finds the first column index whose left edge is at or beyond the viewport end.
 */
export const findFirstOutOfViewIndex = ({
  starts,
  viewEnd,
}: FindFirstOutOfViewIndexArgs): number => {
  let low = 0;
  let high = starts.length - 1;
  let result = starts.length;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midStart = starts[mid] ?? 0;

    if (midStart >= viewEnd) {
      result = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
};
