import type {
  HeatmapAxisItem,
  HeatmapCell,
  HeatmapCellGeometry,
  HeatmapLinkedCell,
  HeatmapScale,
} from '#ui/components/Heatmap/Heatmap.types';

import { HEATMAP } from '#ui/components/Heatmap/Heatmap.constants';

import { getCellFill } from './getCellFill.util';
import { getCellKey } from './getCellKey.util';

type GetHeatmapGeometryArgs = {
  readonly cells: readonly HeatmapCell[];
  readonly cellSize: number;
  readonly columns: readonly HeatmapAxisItem[];
  readonly rows: readonly HeatmapAxisItem[];
  readonly scale: HeatmapScale;
};

export const getHeatmapGeometry = ({
  cells,
  cellSize,
  columns,
  rows,
  scale,
}: GetHeatmapGeometryArgs) => {
  const cellsByKey = new Map(cells.map((cell) => [getCellKey(cell), cell]));

  const rowGeometry = rows.map(({ key: row, label: rowLabel }, rowIndex) => ({
    cells: columns.map(
      (
        { key: column, label: columnLabel },
        columnIndex,
      ): HeatmapCellGeometry => {
        const key = getCellKey({ column, row });
        const cell = cellsByKey.get(key);

        return {
          columnIndex,
          fill: getCellFill({ cell, scale }),
          key,
          label:
            cell?.label ??
            `${rowLabel}, ${columnLabel}: ${HEATMAP.missingValue}`,
          pattern: cell?.pattern,
          rowIndex,
          to: cell?.to,
          x: columnIndex * cellSize,
          y: rowIndex * cellSize,
        };
      },
    ),
    key: row,
    label: rowLabel,
  }));

  return {
    height: rows.length * cellSize,
    linked: rowGeometry
      .flatMap((row) => row.cells)
      .filter((cell): cell is HeatmapLinkedCell => cell.to !== undefined),
    rows: rowGeometry,
    size: cellSize - HEATMAP.cellGap,
    width: columns.length * cellSize,
  };
};
