import type {
  ConfusionMatrixData,
  ConfusionTableRow,
} from './EvalsConfusion.types';

export const confusionColumnKey = (column: string) =>
  `loaded:${column}` as const;

export const confusionTableRows = ({ rows }: ConfusionMatrixData) =>
  rows.map(({ cells, expected, trials }): ConfusionTableRow => ({
    ...Object.fromEntries(
      cells.map((cell) => [confusionColumnKey(cell.column), cell]),
    ),
    expected,
    trials,
  }));
