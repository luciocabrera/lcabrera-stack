import type {
  ConfusionMatrixData,
  ConfusionTableRow,
} from './EvalsConfusion.types';

import { confusionColumnKey } from './confusionColumnKey.util';

export const confusionTableRows = ({ rows }: ConfusionMatrixData) =>
  rows.map(({ cells, expected, trials }): ConfusionTableRow => ({
    ...Object.fromEntries(
      cells.map((cell) => [confusionColumnKey(cell.column), cell]),
    ),
    expected,
    trials,
  }));
