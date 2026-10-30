import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

type FormatPathPointArgs = {
  readonly x: number;
  readonly y: number;
};

export const formatPathPoint = ({ x, y }: FormatPathPointArgs) =>
  `${String(roundToCents(x))},${String(roundToCents(y))}`;
