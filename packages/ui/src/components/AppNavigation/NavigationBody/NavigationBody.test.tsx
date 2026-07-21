// @vitest-environment jsdom

import type { NavbarItemConfig } from '@lcabrera/ui/components/Navbar/Navbar.types';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { collapsedPreferenceMock, sizePreferenceMock } = vi.hoisted(() => ({
  collapsedPreferenceMock: vi.fn<() => string | undefined>(() => {}),
  sizePreferenceMock: vi.fn<() => string | undefined>(() => {}),
}));

type MockNavbarProps = {
  readonly isCompact?: boolean;
  readonly items: readonly { readonly label: string }[];
  readonly size?: string;
};

vi.mock('@lcabrera/ui/components/SidePanel', () => ({
  SidePanelBody: ({ children }: { readonly children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@lcabrera/ui/components/Navbar', () => ({
  Navbar: ({ isCompact, items, size }: MockNavbarProps) => (
    <nav data-compact={String(isCompact)} data-size={size} data-testid='Navbar'>
      {items.map((item) => item.label).join('|')}
    </nav>
  ),
}));

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalNavigationCollapsedPreference: () => collapsedPreferenceMock(),
  useGetGlobalNavigationSizePreference: () => sizePreferenceMock(),
}));

import { NavigationBody } from './NavigationBody.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  collapsedPreferenceMock.mockReset();
  collapsedPreferenceMock.mockReturnValue(undefined);
  sizePreferenceMock.mockReset();
  sizePreferenceMock.mockReturnValue(undefined);
});

describe('NavigationBody', () => {
  it('renders the app-supplied navigation items sized for the density', () => {
    const getNavigationItems = vi.fn(
      (iconSize: number): readonly NavbarItemConfig[] => [
        { end: true, label: `Home ${iconSize}`, to: '/', type: 'link' },
      ],
    );

    render(<NavigationBody getNavigationItems={getNavigationItems} />);

    expect(getNavigationItems).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('Navbar').textContent).toContain('Home');
    expect(screen.getByTestId('Navbar').dataset.compact).toBe('false');
  });

  it('compacts the Navbar when the navigation is collapsed', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationBody getNavigationItems={() => []} />);

    expect(screen.getByTestId('Navbar').dataset.compact).toBe('true');
  });

  it('sizes Navbar buttons from the density preference', () => {
    sizePreferenceMock.mockReturnValue('compact');

    render(<NavigationBody getNavigationItems={() => []} />);

    expect(screen.getByTestId('Navbar').dataset.size).toBe('mini');
  });
});
