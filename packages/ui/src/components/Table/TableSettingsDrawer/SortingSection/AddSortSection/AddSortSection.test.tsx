// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

type MockVirtualSelectProps = {
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
};

const { columnsRef, mockSetColumnsSortings, sortingRef } = vi.hoisted(() => ({
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  mockSetColumnsSortings: vi.fn(),
  sortingRef: { current: [] as readonly { readonly columnKey: string }[] },
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('#ui/components/VirtualSelect', () => ({
  VirtualSelect: ({ options }: MockVirtualSelectProps) => (
    <ul data-testid='column-options'>
      {options.map((option) => (
        <li key={option.value}>{option.label}</li>
      ))}
    </ul>
  ),
}));

vi.mock('../../TableDrawerContext/actions', () => ({
  useSetColumnsSortings: () => mockSetColumnsSortings,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetColumnsSorting: () => sortingRef.current,
}));

import { AddSortSection } from './AddSortSection.component';

const listedOptions = () =>
  [...screen.getByTestId('column-options').children].map(
    (node) => node.textContent,
  );

beforeEach(() => {
  columnsRef.current = [
    { key: 'id', label: 'ID' },
    { isSortable: false, key: 'notes', label: 'Notes' },
    { isSortable: true, key: 'status', label: 'Status' },
  ];
  sortingRef.current = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AddSortSection', () => {
  it('offers columns that do not opt out of sorting', () => {
    render(<AddSortSection />);

    expect(listedOptions()).toEqual(['ID', 'Status']);
  });

  it('drops columns that already carry a sort entry', () => {
    sortingRef.current = [{ columnKey: 'id' }];

    render(<AddSortSection />);

    expect(listedOptions()).toEqual(['Status']);
  });
});
