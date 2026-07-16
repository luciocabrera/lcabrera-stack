// @vitest-environment jsdom

import type { GlobalSettingsState } from '@repo/ui/types/globalSettings.types';
import type { ThemeMode } from '@repo/ui/types/theme.types';
import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
}));

type MockAppProvidersProps = {
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeMode;
  readonly globalSettings?: GlobalSettingsState;
  readonly initialTheme?: ThemeMode;
};

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');

  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
  };
});

vi.mock('@repo/ui', () => ({
  AppProviders: ({
    children,
    defaultTheme,
    globalSettings,
    initialTheme,
  }: MockAppProvidersProps) => (
    <div
      data-default-theme={defaultTheme}
      data-global-settings={JSON.stringify(globalSettings)}
      data-initial-theme={initialTheme}
      data-testid='app-providers'
    >
      {children}
    </div>
  ),
  AppShell: () => <div data-testid='app-shell'>AppShell</div>,
}));

import { Root } from './Root.component';

describe('Root', () => {
  beforeEach(() => {
    useLoaderDataMock.mockReturnValue({
      globalSettings: { navigation: {}, pinning: {} },
      theme: 'dark',
    });
  });

  it('passes loader-derived theme/globalSettings to AppProviders and renders AppShell inside it', () => {
    render(<Root />);

    const appProviders = screen.getByTestId('app-providers');
    expect(appProviders.dataset.defaultTheme).toBe('light');
    expect(appProviders.dataset.initialTheme).toBe('dark');
    expect(appProviders.dataset.globalSettings).toBe(
      JSON.stringify({ navigation: {}, pinning: {} }),
    );
    expect(appProviders.contains(screen.getByTestId('app-shell'))).toBe(true);
  });
});
