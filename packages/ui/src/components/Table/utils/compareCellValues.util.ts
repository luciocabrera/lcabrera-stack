import { toComparableCellValue } from './toComparableCellValue.util';

type CompareCellValuesArgs = {
  readonly left: unknown;
  readonly right: unknown;
};

export const compareCellValues = ({ left, right }: CompareCellValuesArgs) => {
  const isLeftMissing = (left ?? undefined) === undefined;
  const isRightMissing = (right ?? undefined) === undefined;

  if (isLeftMissing || isRightMissing) {
    return Number(isLeftMissing) - Number(isRightMissing);
  }

  const a = toComparableCellValue(left);
  const b = toComparableCellValue(right);

  if (typeof a === 'string' || typeof b === 'string') {
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  }

  if (Number.isNaN(a) || Number.isNaN(b)) {
    return Number(Number.isNaN(a)) - Number(Number.isNaN(b));
  }

  if (a === b) return 0;

  return a < b ? -1 : 1;
};
