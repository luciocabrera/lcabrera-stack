// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  columnFiltersMock,
  persistedExpandedFiltersMock,
  setColumnFiltersMock,
  setTableSettingsExpandedFiltersMock,
} = vi.hoisted(() => ({
  columnFiltersMock: {
    status: {
      operator: 'equals',
      type: 'text',
      value: 'cancelled',
    },
  } as Record<string, unknown>,
  persistedExpandedFiltersMock: vi.fn<() => readonly string[]>(() => []),
  setColumnFiltersMock: vi.fn(),
  setTableSettingsExpandedFiltersMock: vi.fn(),
}));

beforeEach(() => {
  Object.keys(columnFiltersMock).forEach((key) => {
    delete columnFiltersMock[key];
  });
  columnFiltersMock.status = {
    operator: 'equals',
    type: 'text',
    value: 'cancelled',
  };
  persistedExpandedFiltersMock.mockReset();
  persistedExpandedFiltersMock.mockReturnValue([]);
  setColumnFiltersMock.mockReset();
  setTableSettingsExpandedFiltersMock.mockReset();
});

afterEach(() => {
  cleanup();
});

type ActiveFiltersListProps = {
  readonly expandedFilters: Set<string>;
  readonly onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};

type AddFilterSectionProps = {
  readonly onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};

vi.mock('@/components/SidePanel', () => ({
  SidePanelSectionMain: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
  SidePanelSectionOverlay: ({
    children,
  }: {
    readonly children: ReactNode;
    readonly isOpen: boolean;
  }) => <div>{children}</div>,
}));

vi.mock('../TableDrawerContext/actions', () => ({
  useSetColumnFilters: () => setColumnFiltersMock,
}));

vi.mock('../TableDrawerContext/selectors', () => ({
  useGetColumnFilters: () => columnFiltersMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableSettingsExpandedFilters: () => setTableSettingsExpandedFiltersMock,
}));

vi.mock('@/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableSettingsExpandedFilters: () => persistedExpandedFiltersMock(),
}));

vi.mock('./AddFilterSection', () => ({
  AddFilterSection: ({ onExpandedFiltersChange }: AddFilterSectionProps) => (
    <button
      onClick={() => {
        onExpandedFiltersChange(new Set(['customer_name', 'status']));
      }}
      type='button'
    >
      Expand From Add
    </button>
  ),
}));

vi.mock('./ActiveFiltersList', () => ({
  ActiveFiltersList: ({
    expandedFilters,
    onExpandedFiltersChange,
  }: ActiveFiltersListProps) => (
    <div>
      <div data-testid='expanded-filters'>{[...expandedFilters].join(',')}</div>
      <button
        onClick={() => {
          onExpandedFiltersChange(new Set(['status']));
        }}
        type='button'
      >
        Expand From Active
      </button>
    </div>
  ),
}));

vi.mock('./FiltersSectionToolbar', () => ({
  FiltersSectionToolbar: () => <div>Toolbar</div>,
}));

import { FiltersSection } from './FiltersSection.component';

describe('FiltersSection', () => {
  it('restores expanded filters from persisted table settings state', () => {
    persistedExpandedFiltersMock.mockReturnValue(['status']);

    render(<FiltersSection />);

    expect(screen.getByTestId('expanded-filters').textContent).toBe('status');
  });

  it('persists expanded filters when child sections update expansion state', () => {
    render(<FiltersSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand From Add' }));

    expect(setTableSettingsExpandedFiltersMock).toHaveBeenCalledWith([
      'customer_name',
      'status',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Expand From Active' }));

    expect(setTableSettingsExpandedFiltersMock).toHaveBeenLastCalledWith([
      'status',
    ]);
  });
});
