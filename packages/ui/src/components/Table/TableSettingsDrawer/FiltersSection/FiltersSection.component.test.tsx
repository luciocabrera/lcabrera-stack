// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelSectionMain: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
  SidePanelSectionOverlay: ({
    children,
    isOpen,
  }: {
    readonly children: ReactNode;
    readonly isOpen: boolean;
  }) => (
    <div data-testid='overlay'>
      {String(isOpen)}
      {children}
    </div>
  ),
}));

vi.mock('./ActiveFiltersList', () => ({
  ActiveFiltersList: ({ isBusy }: { readonly isBusy?: boolean }) => (
    <div data-testid='active-filters-list'>{String(isBusy ?? false)}</div>
  ),
}));

vi.mock('./AddFilterSection', () => ({
  AddFilterSection: ({
    isBusy,
    onDropdownOpenChange,
  }: {
    readonly isBusy?: boolean;
    readonly onDropdownOpenChange?: (isOpen: boolean) => void;
  }) => (
    <div data-testid='add-filter-section'>
      {String(isBusy ?? false)}
      <button
        onClick={() => {
          onDropdownOpenChange?.(true);
        }}
        type='button'
      >
        Open Dropdown
      </button>
    </div>
  ),
}));

vi.mock('./FiltersSectionToolbar', () => ({
  FiltersSectionToolbar: ({
    isBusy,
    variant,
  }: {
    readonly isBusy?: boolean;
    readonly variant?: 'footer' | 'toolbar';
  }) => (
    <div data-testid='filters-toolbar'>
      {variant ?? 'footer'}:{String(isBusy ?? false)}
    </div>
  ),
}));

import { FiltersSection } from './FiltersSection.component';

afterEach(() => {
  cleanup();
});

describe('FiltersSection', () => {
  it('composes add section, active list, and footer toolbar', () => {
    render(<FiltersSection />);

    expect(screen.getByTestId('add-filter-section')).not.toBeNull();
    expect(screen.getByTestId('active-filters-list')).not.toBeNull();
    expect(screen.getByTestId('filters-toolbar').textContent).toBe(
      'footer:false',
    );
  });

  it('opens the overlay while the add-filter dropdown is open', () => {
    render(<FiltersSection />);

    expect(screen.getByTestId('overlay').textContent).toContain('false');

    fireEvent.click(screen.getByRole('button', { name: 'Open Dropdown' }));

    expect(screen.getByTestId('overlay').textContent).toContain('true');
  });

  it('forwards the busy state to all delegates', () => {
    render(<FiltersSection isBusy={true} />);

    expect(screen.getByTestId('add-filter-section').textContent).toContain(
      'true',
    );
    expect(screen.getByTestId('active-filters-list').textContent).toBe('true');
    expect(screen.getByTestId('filters-toolbar').textContent).toBe(
      'footer:true',
    );
  });
});
