import type { HeatmapLinkedCell } from '#ui/components/Heatmap/Heatmap.types';

import { HEATMAP } from '#ui/components/Heatmap/Heatmap.constants';
import { resolveGridFocusKey } from '#ui/components/Table/contexts/TableFocus/focus/actions/utils/resolveGridFocusKey.util';

import { findNearestIndex } from './findNearestIndex.util';

type ResolveHeatmapFocusMoveArgs = {
  readonly current: HeatmapLinkedCell;
  readonly isRangeModifier: boolean;
  readonly key: string;
  readonly linked: readonly HeatmapLinkedCell[];
};

export const resolveHeatmapFocusMove = ({
  current,
  isRangeModifier,
  key,
  linked,
}: ResolveHeatmapFocusMoveArgs) => {
  const rowIndexes = linked.map(({ rowIndex }) => rowIndex);
  const target = resolveGridFocusKey({
    columnIndex: current.columnIndex,
    isRangeModifier,
    key,
    lastColumnIndex: Math.max(...linked.map(({ columnIndex }) => columnIndex)),
    lastRowIndex: Math.max(...rowIndexes),
    pageRows: HEATMAP.pageRows,
    rowIndex: current.rowIndex,
  });

  if (target === undefined) return;

  const nearestRow = findNearestIndex({
    current: current.rowIndex,
    indexes: rowIndexes,
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
