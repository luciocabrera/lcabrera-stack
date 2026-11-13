import { describe, expect, it } from 'vite-plus/test';

import { ChartSettingsContext } from './ChartSettingsContext.context';

describe('ChartSettingsContext', () => {
  it('names itself in React DevTools', () => {
    expect(ChartSettingsContext.displayName).toBe('ChartSettingsContext');
  });
});
