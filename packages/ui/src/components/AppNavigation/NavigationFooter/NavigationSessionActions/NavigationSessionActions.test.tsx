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

const { collapsedPreferenceMock, logoutRouteMock, sizePreferenceMock } =
  vi.hoisted(() => ({
    collapsedPreferenceMock: vi.fn<() => string | undefined>(() => {}),
    logoutRouteMock: vi.fn<() => string>(() => '/logout'),
    sizePreferenceMock: vi.fn<() => string | undefined>(() => {}),
  }));

type MockButtonProps = {
  readonly children: ReactNode;
  readonly isIconOnly?: boolean;
  readonly size?: string;
  readonly tooltipContent?: string;
  readonly type?: string;
};

vi.mock('#ui/components/Button', () => ({
  Button: ({
    children,
    isIconOnly,
    size,
    tooltipContent,
    type,
  }: MockButtonProps) => (
    <button
      aria-label='Log out'
      data-icon-only={String(isIconOnly)}
      data-size={size}
      data-tooltip={tooltipContent ?? 'none'}
      type={type === 'submit' ? 'submit' : 'button'}
    >
      {children}
    </button>
  ),
}));

vi.mock('#ui/contexts/AppConfigContext/selectors', () => ({
  useGetAppLogoutRoute: () => logoutRouteMock(),
}));

vi.mock('#ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalNavigationCollapsedPreference: () => collapsedPreferenceMock(),
  useGetGlobalNavigationSizePreference: () => sizePreferenceMock(),
}));

vi.mock('react-router', () => ({
  Form: ({
    action,
    children,
    method,
  }: {
    readonly action: string;
    readonly children: ReactNode;
    readonly method: string;
  }) => (
    <form action={action} data-method={method}>
      {children}
    </form>
  ),
}));

import { NavigationSessionActions } from './NavigationSessionActions.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  collapsedPreferenceMock.mockReset();
  collapsedPreferenceMock.mockReturnValue(undefined);
  logoutRouteMock.mockReset();
  logoutRouteMock.mockReturnValue('/logout');
  sizePreferenceMock.mockReset();
  sizePreferenceMock.mockReturnValue(undefined);
});

describe('NavigationSessionActions', () => {
  it('renders a POST form to the configured logout route with a submit button', () => {
    const { container } = render(<NavigationSessionActions />);

    const form = container.querySelector('form');
    expect(form?.getAttribute('action')).toBe('/logout');
    expect(form?.dataset.method).toBe('post');

    const button = screen.getByRole('button', { name: 'Log out' });
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.dataset.iconOnly).toBe('false');
    expect(button.dataset.tooltip).toBe('none');
  });

  it('submits to the app-supplied logout route rather than a hard-coded one', () => {
    logoutRouteMock.mockReturnValue('/auth/sign-out');

    const { container } = render(<NavigationSessionActions />);

    expect(container.querySelector('form')?.getAttribute('action')).toBe(
      '/auth/sign-out',
    );
  });

  it('is icon-only with a tooltip when the sidebar is collapsed', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationSessionActions />);

    const button = screen.getByRole('button', { name: 'Log out' });
    expect(button.dataset.iconOnly).toBe('true');
    expect(button.dataset.tooltip).toBe('Log out');
  });

  it('sizes the button from the density preference', () => {
    sizePreferenceMock.mockReturnValue('compact');

    render(<NavigationSessionActions />);

    expect(screen.getByRole('button', { name: 'Log out' }).dataset.size).toBe(
      'mini',
    );
  });
});
