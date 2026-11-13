import { describe, expect, it } from 'vite-plus/test';

import { getHeatmapInitialSettings } from './getHeatmapInitialSettings.util';

describe('getHeatmapInitialSettings', () => {
  it('opens at the given density with every label, the legend and a hidden data table', () => {
    expect(
      getHeatmapInitialSettings({
        density: 'dense',
        legend: [{ label: 'High', tone: 'success' }],
      }),
    ).toEqual({
      axisLabelStep: 1,
      density: 'dense',
      hasLegend: true,
      isDataTableVisible: false,
    });
  });

  it('offers the legend toggle for a sequential scale with no legend items', () => {
    expect(
      getHeatmapInitialSettings({
        density: 'compact',
        scale: { domain: [0, 1], kind: 'sequential' },
      }).hasLegend,
    ).toBe(true);
  });

  it('offers no legend toggle when the chart draws no legend', () => {
    expect(
      getHeatmapInitialSettings({ density: 'compact' }).hasLegend,
    ).toBeUndefined();
  });
});
