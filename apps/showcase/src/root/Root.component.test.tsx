// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

type MockRootComponentProps = {
  readonly appId?: string;
  readonly getNavigationItems: (iconSize: number) => readonly unknown[];
  readonly isAuthEnabled?: boolean;
  readonly logoutRoute?: string;
};

vi.mock('@lcabrera/ui', () => ({
  RootComponent: ({
    appId,
    getNavigationItems,
    isAuthEnabled,
    logoutRoute,
  }: MockRootComponentProps) => (
    <div
      data-app-id={appId}
      data-auth={String(isAuthEnabled)}
      data-item-count={String(getNavigationItems(24).length)}
      data-logout={logoutRoute}
      data-testid='root-component'
    />
  ),
}));

import { Root } from './Root.component';

afterEach(() => {
  cleanup();
});

describe('Root', () => {
  it('hands the shell this app id, its route links and its session config', () => {
    render(<Root />);

    const root = screen.getByTestId('root-component');

    expect(root.dataset.appId).toBe('react-router');
    expect(root.dataset.auth).toBe('true');
    expect(root.dataset.logout).toBe('/logout');
    expect(Number(root.dataset.itemCount)).toBeGreaterThan(0);
  });
});
