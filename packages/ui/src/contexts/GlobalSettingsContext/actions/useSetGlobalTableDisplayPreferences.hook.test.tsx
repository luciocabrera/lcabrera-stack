// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { GlobalSettingsState } from '#ui/types/globalSettings.types';

import { INITIAL_GLOBAL_SETTINGS } from '../GlobalSettingsContext.constants';
import { GlobalSettingsProvider } from '../GlobalSettingsContext.provider';
import { useGetGlobalTableDisplayPreferences } from '../selectors/useGetGlobalTableDisplayPreferences.hook';
import { useSetGlobalTableDisplayPreferences } from './useSetGlobalTableDisplayPreferences.hook';

const { persistMock } = vi.hoisted(() => ({ persistMock: vi.fn() }));

vi.mock('./usePersistGlobalSettingsAction.hook', () => ({
  usePersistGlobalSettingsAction: () => persistMock,
}));

const SEEDED: GlobalSettingsState = {
  ...INITIAL_GLOBAL_SETTINGS,
  navigation: { size: 'small' },
  tableDisplay: { headerDensity: 'spacious' },
};

const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <GlobalSettingsProvider initialSettings={SEEDED}>
    {children}
  </GlobalSettingsProvider>
);

const renderDisplayPreferences = () =>
  renderHook(
    () => ({
      preferences: useGetGlobalTableDisplayPreferences(),
      setPreferences: useSetGlobalTableDisplayPreferences(),
    }),
    { wrapper },
  );

beforeEach(() => {
  persistMock.mockReset();
});

describe('useSetGlobalTableDisplayPreferences', () => {
  it('reads the table display slice the provider was seeded with', () => {
    const { result } = renderDisplayPreferences();

    expect(result.current.preferences).toStrictEqual({
      headerDensity: 'spacious',
    });
  });

  it('merges an update into the stored defaults and persists the whole snapshot', () => {
    const { result } = renderDisplayPreferences();

    act(() => {
      result.current.setPreferences({ density: 'dense' });
    });

    const expected = {
      ...SEEDED,
      tableDisplay: { density: 'dense', headerDensity: 'spacious' },
    };

    expect(result.current.preferences).toStrictEqual(expected.tableDisplay);
    expect(persistMock).toHaveBeenCalledExactlyOnceWith(expected);
  });
});
