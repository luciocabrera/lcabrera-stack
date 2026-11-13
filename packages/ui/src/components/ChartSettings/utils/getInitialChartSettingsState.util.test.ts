import { describe, expect, it } from 'vite-plus/test';

import { getInitialChartSettingsState } from './getInitialChartSettingsState.util';

describe('getInitialChartSettingsState', () => {
  it('applies and drafts the given settings with the drawer closed and unpinned', () => {
    const settings = { density: 'dense', hasLegend: true } as const;

    expect(getInitialChartSettingsState(settings)).toEqual({
      applied: settings,
      draft: settings,
      isOpen: false,
      isPinned: false,
    });
  });
});
