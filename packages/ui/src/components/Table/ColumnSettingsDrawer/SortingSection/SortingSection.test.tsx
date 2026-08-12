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
  mockResetColumnSorting,
  mockSetColumnSorting,
  normalizedColumnRef,
  sortDirectionRef,
} = vi.hoisted(() => ({
  mockResetColumnSorting: vi.fn(),
  mockSetColumnSorting: vi.fn(),
  normalizedColumnRef: { current: {} as Record<string, unknown> },
  sortDirectionRef: { current: undefined as 'asc' | 'desc' | undefined },
}));

vi.mock('../ColumnDrawerContext/actions', () => ({
  useResetColumnSorting: () => mockResetColumnSorting,
  useSetColumnSorting: () => mockSetColumnSorting,
}));

vi.mock('../ColumnDrawerContext/selectors', () => ({
  useGetColumnSorting: () => sortDirectionRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnSelectedKey: () => 'name',
}));

import { SortingSection } from './SortingSection.component';

const getToggle = (label: string) => {
  const button = screen
    .getAllByText(label)
    .map((node) => node.closest('button'))
    .find((node) => node !== null);
  if (button === undefined) throw new Error(`No "${label}" button`);
  return button;
};

beforeEach(() => {
  sortDirectionRef.current = undefined;
  normalizedColumnRef.current = { key: 'name', label: 'Name' };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SortingSection', () => {
  it('renders both sorting commands and dispatches nothing on its own', () => {
    render(<SortingSection />);

    expect(getToggle('Ascending')).not.toBeNull();
    expect(getToggle('Descending')).not.toBeNull();
    expect(mockSetColumnSorting).not.toHaveBeenCalled();
  });

  it('applies ascending from the draft state and toggles it back off', () => {
    const { rerender } = render(<SortingSection />);

    fireEvent.click(getToggle('Ascending'));
    expect(mockSetColumnSorting).toHaveBeenCalledWith('asc');

    sortDirectionRef.current = 'asc';
    rerender(<SortingSection />);

    fireEvent.click(getToggle('Ascending'));
    expect(mockSetColumnSorting).toHaveBeenCalledWith(undefined);
  });

  it('applies descending independently of the ascending draft state', () => {
    sortDirectionRef.current = 'asc';
    render(<SortingSection />);

    fireEvent.click(getToggle('Descending'));

    expect(mockSetColumnSorting).toHaveBeenCalledWith('desc');
  });

  it('disables both commands when the column has no sorting capability', () => {
    normalizedColumnRef.current = {
      isSortable: false,
      key: 'name',
      label: 'Name',
    };

    render(<SortingSection />);

    expect(getToggle('Ascending').disabled).toBe(true);
    expect(getToggle('Descending').disabled).toBe(true);
  });
});
