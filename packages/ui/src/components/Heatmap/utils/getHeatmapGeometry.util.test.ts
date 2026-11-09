import { describe, expect, it } from 'vite-plus/test';

import { getHeatmapGeometry } from './getHeatmapGeometry.util';

const AXES = {
  columns: [
    { key: 'c1', label: 'Column 1' },
    { key: 'c2', label: 'Column 2' },
  ],
  rows: [
    { key: 'r1', label: 'Row 1' },
    { key: 'r2', label: 'Row 2' },
    { key: 'r3', label: 'Row 3' },
  ],
};

const TONE = { kind: 'tone' } as const;

describe('getHeatmapGeometry', () => {
  it('sizes the plot from the axes and the cell size', () => {
    const geometry = getHeatmapGeometry({
      ...AXES,
      cells: [],
      cellSize: 20,
      scale: TONE,
    });

    expect(geometry.width).toBe(40);
    expect(geometry.height).toBe(60);
    expect(geometry.size).toBe(19);
  });

  it('places a cell by its axis positions', () => {
    const { rows } = getHeatmapGeometry({
      ...AXES,
      cells: [{ column: 'c2', label: 'Here', row: 'r3', tone: 'info' }],
      cellSize: 20,
      scale: TONE,
    });

    expect(rows[2]?.cells[1]).toEqual({
      columnIndex: 1,
      fill: { kind: 'tone', tone: 'info' },
      key: 'r3/c2',
      label: 'Here',
      pattern: undefined,
      rowIndex: 2,
      to: undefined,
      x: 20,
      y: 40,
    });
  });

  it('draws a missing cell as empty, named by its row and column', () => {
    const { rows } = getHeatmapGeometry({
      ...AXES,
      cells: [],
      cellSize: 20,
      scale: TONE,
    });

    expect(rows[1]?.cells[0]).toMatchObject({
      fill: { kind: 'empty' },
      label: 'Row 2, Column 1: No value',
      x: 0,
      y: 20,
    });
    expect(rows.map(({ cells }) => cells.length)).toEqual([2, 2, 2]);
    expect(rows.map(({ label }) => label)).toEqual(['Row 1', 'Row 2', 'Row 3']);
    expect(rows.map(({ key }) => key)).toEqual(['r1', 'r2', 'r3']);
  });

  it('carries the pattern and the link of a cell', () => {
    const { rows } = getHeatmapGeometry({
      ...AXES,
      cells: [
        {
          column: 'c1',
          label: 'Linked',
          pattern: 'dots',
          row: 'r1',
          to: '/cell',
        },
      ],
      cellSize: 20,
      scale: TONE,
    });

    expect(rows[0]?.cells[0]).toMatchObject({ pattern: 'dots', to: '/cell' });
  });

  it('lists only the linked cells, in reading order', () => {
    const { linked } = getHeatmapGeometry({
      ...AXES,
      cells: [
        { column: 'c1', label: 'Last', row: 'r3', to: '/last' },
        { column: 'c2', label: 'Plain', row: 'r2' },
        { column: 'c2', label: 'First', row: 'r1', to: '/first' },
      ],
      cellSize: 20,
      scale: TONE,
    });

    expect(linked.map(({ label }) => label)).toEqual(['First', 'Last']);
  });

  it('draws no cell whose row or column is not on an axis', () => {
    const { linked, rows } = getHeatmapGeometry({
      ...AXES,
      cells: [
        { column: 'nope', label: 'Off', row: 'r1', to: '/off' },
        { column: 'c1', label: 'Off', row: 'nope', to: '/off' },
      ],
      cellSize: 20,
      scale: TONE,
    });

    expect(linked).toEqual([]);
    expect(rows.flatMap(({ cells }) => cells)).toHaveLength(6);
    expect(
      rows.flatMap(({ cells }) => cells).map(({ label }) => label),
    ).not.toContain('Off');
  });

  it('keeps the last of two cells at one position', () => {
    const { rows } = getHeatmapGeometry({
      ...AXES,
      cells: [
        { column: 'c1', label: 'Old', row: 'r1' },
        { column: 'c1', label: 'New', row: 'r1' },
      ],
      cellSize: 20,
      scale: TONE,
    });

    expect(rows[0]?.cells[0]?.label).toBe('New');
  });

  it('passes the scale to the fill', () => {
    const { rows } = getHeatmapGeometry({
      ...AXES,
      cells: [{ column: 'c1', label: 'Half', row: 'r1', value: 5 }],
      cellSize: 20,
      scale: { domain: [0, 10], kind: 'sequential' },
    });

    expect(rows[0]?.cells[0]?.fill).toEqual({
      kind: 'sequential',
      percent: '50%',
    });
  });
});
