// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { isAuthEnabledMock } = vi.hoisted(() => ({
  isAuthEnabledMock: vi.fn<() => boolean>(() => false),
}));

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('#ui/contexts/AppConfigContext/selectors', () => ({
  useGetIsAuthEnabled: () => isAuthEnabledMock(),
}));

vi.mock('./NavigationThemeControl/NavigationThemeControl.component', () => ({
  NavigationThemeControl: () => <div data-testid='theme-control'>theme</div>,
}));

vi.mock(
  './NavigationSessionActions/NavigationSessionActions.component',
  () => ({
    NavigationSessionActions: () => (
      <div data-testid='session-actions'>session</div>
    ),
  }),
);

import { NavigationFooter } from './NavigationFooter.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  isAuthEnabledMock.mockReset();
  isAuthEnabledMock.mockReturnValue(false);
});

describe('NavigationFooter', () => {
  it('always renders the theme control', () => {
    render(<NavigationFooter />);

    expect(screen.getByTestId('theme-control').textContent).toBe('theme');
  });

  it('omits the session actions when the app has no session', () => {
    render(<NavigationFooter />);

    expect(screen.queryByTestId('session-actions')).toBeNull();
  });

  it('renders the session actions when the app declared auth is enabled', () => {
    isAuthEnabledMock.mockReturnValue(true);

    render(<NavigationFooter />);

    expect(screen.getByTestId('session-actions').textContent).toBe('session');
  });
});
