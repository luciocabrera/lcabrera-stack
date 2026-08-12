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

import type { DraggableItem } from '#ui/components/DraggableList';

type MockDraggableListProps = {
  readonly items: readonly DraggableItem[];
};

type MockSortItemContentProps = {
  readonly item: { readonly label: string };
};

const { columnsRef, mockSetColumnsSortings, sortingRef } = vi.hoisted(() => ({
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  mockSetColumnsSortings: vi.fn(),
  sortingRef: {
    current: [] as readonly {
      readonly columnKey: string;
      readonly direction: 'asc' | 'desc';
    }[],
  },
}));

vi.mock('#ui/components/DraggableList', () => ({
  DraggableList: ({ items }: MockDraggableListProps) => (
    <ul data-testid='sort-items'>
      {items.map((item) => (
        <li key={item.id}>{item.content}</li>
      ))}
    </ul>
  ),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('../../TableDrawerContext/actions', () => ({
  useClearSorting: () => vi.fn(),
  useResetSorting: () => vi.fn(),
  useSetColumnsSortings: () => mockSetColumnsSortings,
  useSortByColumnOrder: () => vi.fn(),
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetColumnsSorting: () => sortingRef.current,
}));

vi.mock('./SortItemContent', () => ({
  SortItemContent: ({ item }: MockSortItemContentProps) => (
    <span>{item.label}</span>
  ),
}));

import { ActiveSortList } from './ActiveSortList.component';

const listedLabels = () =>
  [...screen.getByTestId('sort-items').children].map(
    (node) => node.textContent,
  );

beforeEach(() => {
  columnsRef.current = [
    { key: 'id', label: 'ID' },
    { isSortable: false, key: 'notes', label: 'Notes' },
  ];
  sortingRef.current = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ActiveSortList', () => {
  it('labels a sort entry from the matching sortable column', () => {
    sortingRef.current = [{ columnKey: 'id', direction: 'asc' }];

    render(<ActiveSortList />);

    expect(listedLabels()).toEqual(['ID']);
  });

  it('falls back to the column key when the sorted column opts out of sorting', () => {
    sortingRef.current = [{ columnKey: 'notes', direction: 'desc' }];

    render(<ActiveSortList />);

    expect(listedLabels()).toEqual(['notes']);
  });

  it('shows the empty-state message when nothing is sorted', () => {
    render(<ActiveSortList />);

    expect(screen.queryByTestId('sort-items')).toBeNull();
    expect(screen.getByText(/No sorting applied/)).not.toBeNull();
  });
});
