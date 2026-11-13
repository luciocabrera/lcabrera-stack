// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { useChartSettingsContextValue } from './useChartSettingsContextValue.hook';

describe('useChartSettingsContextValue', () => {
  it('refuses to run outside a ChartSettingsProvider', () => {
    expect(() => renderHook(() => useChartSettingsContextValue())).toThrow(
      'useChartSettingsContextValue must be used within a ChartSettingsProvider',
    );
  });
});
