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

const {
  aggregatesRef,
  columnsRef,
  groupingKeysRef,
  mockSetColumnsSortings,
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
  useGetGroupingAggregates: () => aggregatesRef.current,
  useGetGroupingKeys: () => groupingKeysRef.current,
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
  aggregatesRef.current = [];
  groupingKeysRef.current = [];
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

describe('under a grouping', () => {
  it('offers only the group keys, since the read drops every other term', () => {
    groupingKeysRef.current = ['status'];

    render(<AddSortSection />);

    expect(listedOptions()).toEqual(['Status']);
  });

  it('offers a measured column no more than an unmeasured one', () => {
    // `toGroupSort` matches a measure by its `column:fn` token, never by the
    // bare column, so `status` here would order nothing.
    columnsRef.current = [
      { isSortable: true, key: 'region', label: 'Region' },
      { isSortable: true, key: 'status', label: 'Status' },
    ];
    aggregatesRef.current = [{ columnKey: 'status', fn: 'count' }];
    groupingKeysRef.current = ['region'];

    render(<AddSortSection />);

    expect(listedOptions()).toEqual(['Region']);
  });

  it('offers every sortable column again once the grouping names nothing declared', () => {
    groupingKeysRef.current = ['gone'];

    render(<AddSortSection />);

    expect(listedOptions()).toEqual(['ID', 'Status']);
  });
});
