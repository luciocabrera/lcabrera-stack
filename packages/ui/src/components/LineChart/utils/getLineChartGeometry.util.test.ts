import { describe, expect, it } from 'vite-plus/test';

import { formatChartValue } from './formatChartValue.util';
import { getLineChartGeometry } from './getLineChartGeometry.util';

const formatters = { x: formatChartValue, y: formatChartValue };

describe('getLineChartGeometry', () => {
  it('scales every series, marker and tick onto a 100-unit plot', () => {
    const geometry = getLineChartGeometry({
      formatters,
      markers: [{ label: 'Half', x: 5 }],
      mode: 'never',
      series: [
        {
          id: 'a',
          label: 'A',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 50 },
          ],
        },
        { id: 'b', label: 'B', points: [{ x: 10, y: 100 }] },
      ],
    });

    expect(geometry.series.map(({ line, tone }) => ({ line, tone }))).toEqual([
      { line: 'M0,100L100,50', tone: 'info' },
      { line: 'M100,0L100,0', tone: 'success' },
    ]);
    expect(geometry.markers.map(({ d }) => d)).toEqual(['M50,0L50,100']);
    expect(
      geometry.xTicks.map(({ at, text }) => `${text}@${String(at)}`),
    ).toEqual(['0@0', '2@20', '4@40', '6@60', '8@80', '10@100']);
    expect(geometry.yTicks.map(({ at }) => at)).toEqual([
      100, 80, 60, 40, 20, 0,
    ]);
    expect(geometry.gridlines.startsWith('M0,100L100,100M0,80L100,80')).toBe(
      true,
    );
  });

  it('reads the domain, ticks and format of each axis', () => {
    const geometry = getLineChartGeometry({
      formatters: { x: (x) => `t${String(x)}`, y: (y) => `${String(y)}%` },
      mode: 'never',
      series: [{ id: 'a', label: 'A', points: [{ x: 5, y: 5 }] }],
      xAxis: { domain: [0, 10], ticks: [0, 10] },
      yAxis: { domain: [0, 10], ticks: [5] },
    });

    expect(geometry.series[0]?.line).toBe('M50,50L50,50');
    expect(geometry.xTicks.map(({ text }) => text)).toEqual(['t0', 't10']);
    expect(geometry.yTicks).toEqual([{ at: 50, key: '5', text: '5%' }]);
  });

  it('places time ticks across a date domain', () => {
    const geometry = getLineChartGeometry({
      formatters,
      mode: 'never',
      series: [
        {
          id: 'a',
          label: 'A',
          points: [
            { x: new Date('2026-01-01T00:00:00Z'), y: 1 },
            { x: new Date('2026-01-03T00:00:00Z'), y: 1 },
          ],
        },
      ],
    });

    expect(geometry.xTicks.map(({ text }) => text)).toEqual([
      '2026-01-01',
      '2026-01-01 12:00',
      '2026-01-02',
      '2026-01-02 12:00',
      '2026-01-03',
    ]);
  });

  it('draws nothing and places no tick without data', () => {
    expect(
      getLineChartGeometry({ formatters, mode: 'auto', series: [] }),
    ).toEqual({
      gridlines: '',
      markers: [],
      series: [],
      xTicks: [],
      yTicks: [],
    });
  });

  it('places markers on a chart with no values', () => {
    const geometry = getLineChartGeometry({
      formatters,
      markers: [
        { label: 'One', x: 0 },
        { label: 'Two', x: 4 },
      ],
      mode: 'auto',
      series: [],
    });

    expect(geometry.markers.map(({ at }) => at)).toEqual([0, 100]);
    expect(geometry.yTicks).toEqual([]);
  });
});
