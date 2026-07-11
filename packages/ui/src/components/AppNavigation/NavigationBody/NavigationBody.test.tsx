// @vitest-environment jsdom

import type { ToolbarItemConfig } from '@repo/ui/components/Toolbar/Toolbar.types';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { collapsedPreferenceMock, sizePreferenceMock } = vi.hoisted(() => ({
  collapsedPreferenceMock: vi.fn<() => string | undefined>(() => {}),
  sizePreferenceMock: vi.fn<() => string | undefined>(() => {}),
}));

type MockToolbarProps = {
  readonly isCompact?: boolean;
  readonly items: readonly { readonly label: string }[];
  readonly size?: string;
};

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelBody: ({ children }: { readonly children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@repo/ui/components/Toolbar', () => ({
  Toolbar: ({ isCompact, items, size }: MockToolbarProps) => (
    <nav
      data-compact={String(isCompact)}
      data-size={size}
      data-testid='toolbar'
    >
      {items.map((item) => item.label).join('|')}
    </nav>
  ),
}));

vi.mock('@repo/ui/contexts/GlobalSettingsContext/selectors', () => ({
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
      (iconSize: number): readonly ToolbarItemConfig[] => [
        { end: true, label: `Home ${iconSize}`, to: '/', type: 'link' },
      ],
    );

    render(<NavigationBody getNavigationItems={getNavigationItems} />);

    expect(getNavigationItems).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('toolbar').textContent).toContain('Home');
    expect(screen.getByTestId('toolbar').dataset.compact).toBe('false');
  });

  it('compacts the toolbar when the navigation is collapsed', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationBody getNavigationItems={() => []} />);

    expect(screen.getByTestId('toolbar').dataset.compact).toBe('true');
  });

  it('sizes toolbar buttons from the density preference', () => {
    sizePreferenceMock.mockReturnValue('compact');

    render(<NavigationBody getNavigationItems={() => []} />);

    expect(screen.getByTestId('toolbar').dataset.size).toBe('mini');
  });
});
