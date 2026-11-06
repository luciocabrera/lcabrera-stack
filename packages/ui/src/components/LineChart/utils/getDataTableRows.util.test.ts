import { describe, expect, it } from 'vite-plus/test';

import { getDataTableRows } from './getDataTableRows.util';

const GAP: null = JSON.parse('null');

const formatters = {
  x: (x: Date | number) => `x${String(x)}`,
  y: (y: number) => `${String(y)}%`,
};

describe('getDataTableRows', () => {
  it('lists every point of every series in order, gaps included', () => {
    expect(
      getDataTableRows({
        formatters,
        series: [
          {
            id: 'a',
            label: 'A',
            points: [
              { x: 0, y: 1 },
              { to: '/a/1', x: 1, y: GAP },
            ],
          },
          {
            id: 'b',
            label: 'B',
            points: [
              { x: 0, y: Number('NaN') },
              { x: Number('Infinity'), y: 2 },
            ],
          },
        ],
      }),
    ).toEqual([
      { key: 'a-0', series: 'A', to: undefined, x: 'x0', y: '1%' },
      { key: 'a-1', series: 'A', to: '/a/1', x: 'x1', y: 'No value' },
      { key: 'b-0', series: 'B', to: undefined, x: 'x0', y: 'No value' },
      { key: 'b-1', series: 'B', to: undefined, x: 'No value', y: '2%' },
    ]);
  });
});
