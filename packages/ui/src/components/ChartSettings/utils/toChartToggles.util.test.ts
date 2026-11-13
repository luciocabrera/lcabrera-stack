import { describe, expect, it } from 'vite-plus/test';

import { toChartToggles } from './toChartToggles.util';

describe('toChartToggles', () => {
  it('lists only the toggles a chart seeds, in a fixed order', () => {
    expect(
      toChartToggles({
        density: 'compact',
        hasLegend: false,
        isConnected: true,
        isDataTableVisible: false,
      }),
    ).toEqual([
      { isChecked: false, key: 'hasLegend', label: 'Legend' },
      { isChecked: false, key: 'isDataTableVisible', label: 'Data table' },
      { isChecked: true, key: 'isConnected', label: 'Line between points' },
    ]);
  });

  it('lists none when the chart seeds no toggle', () => {
    expect(toChartToggles({ density: 'compact' })).toEqual([]);
  });
});
