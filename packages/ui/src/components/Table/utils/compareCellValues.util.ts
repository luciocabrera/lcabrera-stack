import { isMissingCellValue } from './isMissingCellValue.util';
import { toComparableCellValue } from './toComparableCellValue.util';

type CompareCellValuesArgs = {
  readonly left: unknown;
  readonly right: unknown;
};

export const compareCellValues = ({ left, right }: CompareCellValuesArgs) => {
  const isLeftMissing = isMissingCellValue(left);
  const isRightMissing = isMissingCellValue(right);

  if (isLeftMissing || isRightMissing) {
    return Number(isLeftMissing) - Number(isRightMissing);
  }

  const a = toComparableCellValue(left);
  const b = toComparableCellValue(right);

  if (typeof a === 'string' || typeof b === 'string') {
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  }

  if (a === b) return 0;

  return a < b ? -1 : 1;
};
