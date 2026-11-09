type FindNearestIndexArgs = {
  readonly current: number;
  readonly indexes: readonly number[];
  readonly target: number;
};

export const findNearestIndex = ({
  current,
  indexes,
  target,
}: FindNearestIndexArgs) =>
  target > current
    ? (indexes.find((index) => index >= target) ?? Math.max(...indexes))
    : (indexes.findLast((index) => index <= target) ?? Math.min(...indexes));
