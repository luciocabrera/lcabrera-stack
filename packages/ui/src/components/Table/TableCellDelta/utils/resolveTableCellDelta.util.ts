import { formatNumber } from '@lcabrera/utils/formatters/format-number.util';

import { parseNumberValue } from '#ui/components/Table/TableBodyCell/utils/parseNumberValue.util';

import type { TableCellDeltaDirection } from '../TableCellDelta.types';

type ResolveTableCellDeltaArgs = {
  readonly precision: number | undefined;
  readonly value: unknown;
};

export const resolveTableCellDelta = ({
  precision,
  value,
}: ResolveTableCellDeltaArgs) => {
  const numeric = parseNumberValue(value);

  if (numeric === undefined || !Number.isFinite(numeric)) return;

  const magnitude =
    precision === undefined
      ? Math.abs(numeric)
      : Number(Math.abs(numeric).toFixed(precision));
  let direction: TableCellDeltaDirection = 'unchanged';

  if (magnitude !== 0) {
    direction = numeric > 0 ? 'increase' : 'decrease';
  }

  return {
    direction,
    magnitude: formatNumber({
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
      value: magnitude,
    }),
  };
};
