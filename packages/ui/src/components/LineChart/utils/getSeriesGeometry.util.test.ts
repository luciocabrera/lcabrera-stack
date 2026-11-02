import { describe, expect, it } from 'vite-plus/test';

import type { LineSeries } from '#ui/components/LineChart/LineChart.types';

import { getSeriesGeometry } from './getSeriesGeometry.util';

const GAP: null = JSON.parse('null');

const formatters = { x: String, y: String };
const scales = {
  x: (value: Date | number) => Number(value) * 10,
  y: (value: number) => 100 - value,
};
const SERIES: LineSeries = {
  id: 'a',
  label: 'A',
  points: [
    { x: 0, y: 10 },
    { label: 'Linked', to: '/a/1', x: 1, y: 20 },
    { x: 2, y: GAP },
    { tone: 'error', x: 3, y: 30 },
  ],
};

describe('getSeriesGeometry', () => {
  it('draws the line, the dots and no band for a plain series', () => {
    expect(
      getSeriesGeometry({
        formatters,
        mode: 'auto',
        scales,
        series: SERIES,
        tone: 'info',
      }),
    ).toEqual({
      band: '',
      dots: [
        {
          d: 'M0,90L0,90',
          key: '0',
          label: 'A: 0, 10',
          left: 0,
          to: undefined,
          tone: 'info',
          top: 90,
        },
        {
          d: 'M10,80L10,80',
          key: '1',
          label: 'Linked',
          left: 10,
          to: '/a/1',
          tone: 'info',
          top: 80,
        },
        {
          d: 'M30,70L30,70',
          key: '2',
          label: 'A: 3, 30',
          left: 30,
          to: undefined,
          tone: 'error',
          top: 70,
        },
      ],
      id: 'a',
      isDashed: false,
      label: 'A',
      line: 'M0,90L10,80M30,70L30,70',
      tone: 'info',
    });
  });

  it('draws the band and keeps the dashing a series asks for', () => {
    const geometry = getSeriesGeometry({
      formatters,
      mode: 'never',
      scales,
      series: {
        ...SERIES,
        band: [
          { lower: 0, upper: 20, x: 0 },
          { lower: 10, upper: 30, x: 1 },
        ],
        isDashed: true,
      },
      tone: 'info',
    });

    expect(geometry.band).toBe('M0,80L10,70L10,90L0,100Z');
    expect(geometry.isDashed).toBe(true);
    expect(geometry.dots.map(({ label }) => label)).toEqual(['Linked']);
  });

  it('counts only drawn points against the auto dot limit', () => {
    const geometry = getSeriesGeometry({
      formatters,
      mode: 'auto',
      scales,
      series: {
        ...SERIES,
        points: [
          ...Array.from({ length: 24 }, (_, x) => ({ x, y: x })),
          ...Array.from({ length: 10 }, (_, x) => ({ x: x + 24, y: GAP })),
        ],
      },
      tone: 'info',
    });

    expect(geometry.dots).toHaveLength(24);
  });

  it('thins the line to the decimation threshold', () => {
    const geometry = getSeriesGeometry({
      formatters,
      mode: 'never',
      scales: { x: (value) => Number(value) / 20, y: (value) => value },
      series: {
        ...SERIES,
        points: Array.from({ length: 2000 }, (_, x) => ({ x, y: x % 7 })),
      },
      tone: 'info',
    });

    expect(geometry.line.split('L')).toHaveLength(1000);
  });
});
