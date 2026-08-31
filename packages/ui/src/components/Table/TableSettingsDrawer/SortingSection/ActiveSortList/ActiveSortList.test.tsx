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
  readonly onOrderChange?: (items: DraggableItem[]) => void;
};

type MockSortItemContentProps = {
  readonly item: { readonly label: string };
};

const {
  aggregatesRef,
  columnsRef,
  groupingKeysRef,
  mockSetColumnsSortings,
  reorderRef,
  sortingRef,
} = vi.hoisted(() => ({
  aggregatesRef: {
    current: [] as readonly {
      readonly columnKey: string;
      readonly fn: string;
    }[],
  },
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  groupingKeysRef: { current: [] as readonly string[] },
  mockSetColumnsSortings: vi.fn(),
  reorderRef: {
    current: undefined as ((items: DraggableItem[]) => void) | undefined,
  },
  sortingRef: {
    current: [] as readonly {
      readonly columnKey: string;
      readonly direction: 'asc' | 'desc';
    }[],
  },
}));

vi.mock('#ui/components/DraggableList', () => ({
  DraggableList: ({ items, onOrderChange }: MockDraggableListProps) => {
    reorderRef.current = onOrderChange;

    return (
      <ul data-testid='sort-items'>
        {items.map((item) => (
          <li key={item.id}>{item.content}</li>
        ))}
      </ul>
    );
  },
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
  useGetGroupingAggregates: () => aggregatesRef.current,
  useGetGroupingKeys: () => groupingKeysRef.current,
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
  aggregatesRef.current = [];
  groupingKeysRef.current = [];
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

describe('a measure among the sorts', () => {
  beforeEach(() => {
    columnsRef.current = [
      { key: 'id', label: 'ID' },
      { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
    ];
  });

  it('reads as the function and the column it measures, not the raw token', () => {
    sortingRef.current = [{ columnKey: 'total_amount:min', direction: 'asc' }];

    render(<ActiveSortList />);

    expect(listedLabels()).toEqual(['Minimum of Total Amount']);
  });

  it('is listed after the column sorts, which is the order the read applies', () => {
    // `buildGroupOrderByClause` splices every aggregate term in at the last
    // group key, so a measure cannot outrank a column sort however it is
    // dragged. Listing it above one would state a precedence that never runs.
    sortingRef.current = [
      { columnKey: 'total_amount:sum', direction: 'desc' },
      { columnKey: 'id', direction: 'asc' },
    ];

    render(<ActiveSortList />);

    expect(listedLabels()).toEqual(['ID', 'Sum of Total Amount']);
  });

  it('keeps several measures in their own order behind the columns', () => {
    sortingRef.current = [
      { columnKey: 'total_amount:sum', direction: 'desc' },
      { columnKey: 'id', direction: 'asc' },
      { columnKey: 'total_amount:min', direction: 'asc' },
    ];

    render(<ActiveSortList />);

    expect(listedLabels()).toEqual([
      'ID',
      'Sum of Total Amount',
      'Minimum of Total Amount',
    ]);
  });
});

describe('under a grouping', () => {
  beforeEach(() => {
    columnsRef.current = [
      { isSortable: true, key: 'region', label: 'Region' },
      { isSortable: true, key: 'email', label: 'Email' },
      { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
    ];
  });

  it('lists only the terms the read applies', () => {
    aggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];
    groupingKeysRef.current = ['region'];
    sortingRef.current = [
      { columnKey: 'email', direction: 'asc' },
      { columnKey: 'region', direction: 'desc' },
      { columnKey: 'total_amount:sum', direction: 'desc' },
    ];

    render(<ActiveSortList />);

    expect(listedLabels()).toEqual(['Region', 'Sum of Total Amount']);
  });

  it('keeps the hidden sort in state, so clearing the grouping brings it back', () => {
    groupingKeysRef.current = ['region'];
    sortingRef.current = [
      { columnKey: 'email', direction: 'asc' },
      { columnKey: 'region', direction: 'desc' },
    ];

    render(<ActiveSortList />);

    reorderRef.current?.([{ content: undefined, id: 'region' }]);

    expect(mockSetColumnsSortings).toHaveBeenCalledExactlyOnceWith([
      { columnKey: 'region', direction: 'desc' },
      { columnKey: 'email', direction: 'asc' },
    ]);
  });

  it('lists every sort again once no declared key is grouped', () => {
    sortingRef.current = [
      { columnKey: 'email', direction: 'asc' },
      { columnKey: 'region', direction: 'desc' },
    ];

    render(<ActiveSortList />);

    expect(listedLabels()).toEqual(['Email', 'Region']);
  });
});
