import { describe, expect, it } from 'vite-plus/test';

import { getLineChartInitialSettings } from './getLineChartInitialSettings.util';

const SERIES = { id: 's', label: 'S', points: [{ x: 1, y: 1 }] };

describe('getLineChartInitialSettings', () => {
  it('seeds density, points, ticks and a hidden data table for one series', () => {
    expect(
      getLineChartInitialSettings({ density: 'compact', series: [SERIES] }),
    ).toEqual({
      density: 'compact',
      hasLegend: undefined,
      hasMarkerLabels: undefined,
      isDataTableVisible: false,
      points: 'auto',
      tickCount: 5,
    });
  });

  it('offers the legend past one series and marker labels when there are markers', () => {
    const settings = getLineChartInitialSettings({
      density: 'compact',
      hasMarkerLabels: false,
      markers: [{ label: 'Release', x: 1 }],
      series: [SERIES, { ...SERIES, id: 't' }],
    });

    expect([settings.hasLegend, settings.hasMarkerLabels]).toEqual([
      true,
      false,
    ]);
  });

  it('offers no legend for a chart with no series', () => {
    expect(
      getLineChartInitialSettings({ density: 'compact', series: [] }).hasLegend,
    ).toBeUndefined();
  });

  it('offers no tick count once the y axis names its own ticks', () => {
    expect(
      getLineChartInitialSettings({
        density: 'compact',
        series: [SERIES],
        yAxis: { ticks: [0, 1] },
      }).tickCount,
    ).toBeUndefined();
  });
});
