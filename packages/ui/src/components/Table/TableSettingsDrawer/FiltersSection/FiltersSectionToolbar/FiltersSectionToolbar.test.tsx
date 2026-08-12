// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const {
  columnFiltersRef,
  expandedFiltersRef,
  mockClearFilters,
  mockResetFilters,
  mockSetExpandedFilters,
} = vi.hoisted(() => ({
  columnFiltersRef: { current: {} as Record<string, unknown> },
  expandedFiltersRef: { current: [] as readonly string[] },
  mockClearFilters: vi.fn(),
  mockResetFilters: vi.fn(),
  mockSetExpandedFilters: vi.fn(),
}));

vi.mock('../../SectionToolbar', () => ({
  SectionToolbar: ({
    buttons,
  }: {
    readonly buttons: readonly {
      readonly isDisabled?: boolean;
      readonly key: string;
      readonly label: string;
      readonly onClick?: () => void;
    }[];
  }) => (
    <div>
      {buttons.map((button) => (
        <button
          disabled={button.isDisabled}
          key={button.key}
          onClick={button.onClick}
          type='button'
        >
          {button.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../TableDrawerContext/actions', () => ({
  useClearFilters: () => mockClearFilters,
  useResetFilters: () => mockResetFilters,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetColumnFilters: () => columnFiltersRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableSettingsExpandedFilters: () => mockSetExpandedFilters,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableSettingsExpandedFilters: () => expandedFiltersRef.current,
}));

import { FiltersSectionToolbar } from './FiltersSectionToolbar.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  columnFiltersRef.current = {
    price: { operator: 'equals', type: 'number', value: 1 },
    status: { operator: 'equals', type: 'text', value: 'x' },
  };
  expandedFiltersRef.current = ['status'];
  mockClearFilters.mockReset();
  mockResetFilters.mockReset();
  mockSetExpandedFilters.mockReset();
});

describe('FiltersSectionToolbar', () => {
  it('clears filters and collapses everything on Clear', () => {
    render(<FiltersSectionToolbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

    expect(mockClearFilters).toHaveBeenCalledTimes(1);
    expect(mockSetExpandedFilters).toHaveBeenCalledWith([]);
  });

  it('dispatches reset without touching expansion state', () => {
    render(<FiltersSectionToolbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }));

    expect(mockResetFilters).toHaveBeenCalledTimes(1);
    expect(mockSetExpandedFilters).not.toHaveBeenCalled();
  });

  it('expands all active filter keys', () => {
    render(<FiltersSectionToolbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand All Filters' }));

    expect(mockSetExpandedFilters).toHaveBeenCalledWith(['price', 'status']);
  });

  it('collapses all filters', () => {
    render(<FiltersSectionToolbar />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse All Filters' }),
    );

    expect(mockSetExpandedFilters).toHaveBeenCalledWith([]);
  });

  it('disables expand-all when every filter is already expanded', () => {
    expandedFiltersRef.current = ['price', 'status'];

    render(<FiltersSectionToolbar />);

    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: 'Expand All Filters',
      }).disabled,
    ).toBe(true);
  });

  it('disables collapse-all when nothing is expanded and clear when no filters', () => {
    columnFiltersRef.current = {};
    expandedFiltersRef.current = [];

    render(<FiltersSectionToolbar />);

    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: 'Collapse All Filters',
      }).disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Clear Filters' })
        .disabled,
    ).toBe(true);
  });
});
