import type { HeatmapLinkedCell } from '#ui/components/Heatmap/Heatmap.types';

import { HEATMAP } from '#ui/components/Heatmap/Heatmap.constants';
import { resolveGridFocusKey } from '#ui/components/Table/contexts/TableFocus/focus/actions/utils/resolveGridFocusKey.util';

import { findNearestIndex } from './findNearestIndex.util';

type ResolveHeatmapFocusMoveArgs = {
  readonly columnCount: number;
  readonly current: HeatmapLinkedCell;
  readonly isRangeModifier: boolean;
  readonly key: string;
  readonly linked: readonly HeatmapLinkedCell[];
  readonly rowCount: number;
};

export const resolveHeatmapFocusMove = ({
  columnCount,
  current,
  isRangeModifier,
  key,
  linked,
  rowCount,
}: ResolveHeatmapFocusMoveArgs) => {
  const target = resolveGridFocusKey({
    columnIndex: current.columnIndex,
    isRangeModifier,
    key,
    lastColumnIndex: columnCount - 1,
    lastRowIndex: rowCount - 1,
    pageRows: HEATMAP.pageRows,
    rowIndex: current.rowIndex,
  });

  if (target === undefined) return;

  const nearestRow = findNearestIndex({
    current: current.rowIndex,
    indexes: linked.map(({ rowIndex }) => rowIndex),
    target: target.rowIndex,
  });
  const inRow = linked.filter(({ rowIndex }) => rowIndex === nearestRow);

  if (nearestRow !== current.rowIndex) {
    const distance = ({ columnIndex }: HeatmapLinkedCell) =>
      Math.abs(columnIndex - target.columnIndex);

    return inRow.toSorted((a, b) => distance(a) - distance(b)).at(0);
  }

  const nearestColumn = findNearestIndex({
    current: current.columnIndex,
    indexes: inRow.map(({ columnIndex }) => columnIndex),
    target: target.columnIndex,
  });

  return inRow.find(({ columnIndex }) => columnIndex === nearestColumn);
};
