export const medianOf = (values: readonly number[]) => {
  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];

  if (upper === undefined) {
    return;
  }

  const lower = sorted.length % 2 === 0 ? sorted[middle - 1] : upper;

  return ((lower ?? upper) + upper) / 2;
};
