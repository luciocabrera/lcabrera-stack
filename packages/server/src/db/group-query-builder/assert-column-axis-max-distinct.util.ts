export const assertColumnAxisMaxDistinct = (maxDistinct: number) => {
  if (!Number.isSafeInteger(maxDistinct) || maxDistinct < 1) {
    throw new Error(
      `columnAxis.maxDistinct must be a positive integer; got ${maxDistinct}.`,
    );
  }
};
