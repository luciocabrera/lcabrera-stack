// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { GlobalSettingsProvider } from '../GlobalSettingsContext.provider';
import { useGetGlobalTableDisplayPreferences } from './useGetGlobalTableDisplayPreferences.hook';

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <GlobalSettingsProvider
    initialSettings={{
      ...INITIAL_GLOBAL_SETTINGS,
      tableDisplay: { density: 'spacious' },
    }}
  >
    {children}
  </GlobalSettingsProvider>
);

describe('useGetGlobalTableDisplayPreferences', () => {
  it('reads the table display slice of the global settings', () => {
    const { result } = renderHook(() => useGetGlobalTableDisplayPreferences(), {
      wrapper,
    });

    expect(result.current).toStrictEqual({ density: 'spacious' });
  });
});
