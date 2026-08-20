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

import type {
  TableAggregateFn,
  TableColumnGroupingCapability,
} from '../Table.types';

type MockVirtualSelectProps = {
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly placeholder: string;
};

const {
  appliedAggregatesRef,
  draftGroupingKeysRef,
  liveGroupingKeysRef,
  mockResolveOfferableAggregates,
  offerRef,
} = vi.hoisted(() => {
  const offer = { current: [] as readonly TableAggregateFn[] };

  return {
    appliedAggregatesRef: {
      current: [] as readonly { columnKey: string; fn: TableAggregateFn }[],
    },
    // The drawer stages its grouping in a draft store and the header menu reads
    // the live one, so each surface feeds the predicate from its own commit
    // context. Two refs, so a surface reading the wrong one is visible.
    draftGroupingKeysRef: { current: [] as readonly string[] },
    liveGroupingKeysRef: { current: [] as readonly string[] },
    mockResolveOfferableAggregates: vi.fn(() => offer.current),
    offerRef: offer,
  };
});

vi.mock('./resolveOfferableAggregates.util', () => ({
  resolveOfferableAggregates: mockResolveOfferableAggregates,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useAddTableColumnAggregate: () => vi.fn(),
  useRemoveTableColumnAggregate: () => vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingAggregates: () => appliedAggregatesRef.current,
  useGetTableGroupingKeys: () => liveGroupingKeysRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnGroupingCapability: (key: string) => CAPABILITIES[key],
  useGetTableGroupingCapabilities: () => CAPABILITIES,
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => COLUMNS,
  }),
);

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/actions',
  () => ({
    useAddColumnAggregate: () => vi.fn(),
  }),
);

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors',
  () => ({
    useGetGroupingKeys: () => draftGroupingKeysRef.current,
  }),
);

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  TableActionsPopoverSeparator: () => <hr />,
  tableActionsPopoverStyles: { menuIcon: {}, menuItem: {} },
}));

vi.mock('#ui/components/VirtualSelect', () => ({
  VirtualSelect: ({ options, placeholder }: MockVirtualSelectProps) => (
    <ul data-testid={placeholder}>
      {options.map((option) => (
        <li key={option.value}>{option.label}</li>
      ))}
    </ul>
  ),
}));

import { AggregateActions } from '#ui/components/Table/TableHeaderCell/TableHeaderActionsMenu/GroupActions/AggregateActions';
import { AddAggregateSection } from '#ui/components/Table/TableSettingsDrawer/GroupingSection/AddAggregateSection';

const COLUMN_PLACEHOLDER = 'Select a column...';

const textCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct'],
  canGroup: true,
  column: 'order_status',
  periods: [],
  role: 'dimension',
  typeName: 'text',
};

const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

/** A column the catalogue can aggregate in no way — the type-illegal case. */
const unsupportedCapability: TableColumnGroupingCapability = {
  aggregates: [],
  canGroup: false,
  column: 'doc',
  periods: [],
  refusal: 'not-a-dimension',
  role: 'unsupported',
  typeName: 'jsonb',
};

const CAPABILITIES: Readonly<Record<string, TableColumnGroupingCapability>> = {
  doc: unsupportedCapability,
  order_status: textCapability,
  total_amount: numericCapability,
};

const COLUMNS = [
  { dataType: 'string', key: 'order_status', label: 'Status' },
  { dataType: 'string', key: 'total_amount', label: 'Total' },
  { dataType: 'string', key: 'doc', label: 'Document' },
];

const listedColumns = () =>
  [...screen.getByTestId(COLUMN_PLACEHOLDER).children].map(
    (node) => node.textContent,
  );

beforeEach(() => {
  appliedAggregatesRef.current = [];
  offerRef.current = [];
  draftGroupingKeysRef.current = [];
  liveGroupingKeysRef.current = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/**
 * Both surfaces answer "may this column be aggregated" through
 * `resolveOfferableAggregates` and neither re-derives it.
 *
 * The probe is the predicate itself, stubbed to an answer the catalogue
 * fixtures contradict: a surface that still consulted the capability map would
 * disagree with the stub, so each assertion below fails for a re-derivation and
 * for nothing else. Asserting that the two agree would not discriminate — a
 * second, correct copy of the rule agrees with the first until it drifts, which
 * is exactly how #830 happened.
 */
describe('resolveOfferableAggregates across both offering surfaces', () => {
  it('suppresses the header menu when the predicate answers nothing', () => {
    offerRef.current = [];

    render(<AggregateActions columnKey='total_amount' onClose={vi.fn()} />);

    // The catalogue reports `count` and `sum` here, so a menu shaped from it
    // would still show both.
    expect(screen.queryByText('Sum')).toBeNull();
    expect(screen.queryByText('Count')).toBeNull();
    expect(screen.queryByText('No Aggregate')).toBeNull();
  });

  it('empties the drawer picker when the predicate answers nothing', () => {
    offerRef.current = [];

    render(<AddAggregateSection />);

    expect(listedColumns()).toEqual([]);
  });

  it('fills the header menu from the predicate, over the catalogue', () => {
    // `doc` is the column the catalogue offers nothing for. The stub offers
    // `sum`, and the menu follows the stub.
    offerRef.current = ['sum'];

    render(<AggregateActions columnKey='doc' onClose={vi.fn()} />);

    expect(screen.getByText('Sum')).not.toBeNull();
    expect(screen.getByText('No Aggregate')).not.toBeNull();
  });

  it('fills the drawer picker from the predicate, over the catalogue', () => {
    offerRef.current = ['sum'];
    draftGroupingKeysRef.current = ['order_status'];

    render(<AddAggregateSection />);

    // Every column, including the one the catalogue refuses and the one staged
    // as a group key — both of which the picker's own filter used to drop.
    expect(listedColumns()).toEqual(['Status', 'Total', 'Document']);
  });

  it('tells the predicate when the header menu column is a group key', () => {
    liveGroupingKeysRef.current = ['order_status'];

    render(<AggregateActions columnKey='order_status' onClose={vi.fn()} />);

    expect(mockResolveOfferableAggregates).toHaveBeenCalledWith({
      capability: textCapability,
      isGroupKey: true,
    });
  });

  it('tells the predicate when a drawer-staged column is a group key', () => {
    draftGroupingKeysRef.current = ['order_status'];

    render(<AddAggregateSection />);

    expect(mockResolveOfferableAggregates).toHaveBeenCalledWith({
      capability: textCapability,
      isGroupKey: true,
    });
    // And that the columns beside it are not — a surface passing a constant
    // would satisfy the assertion above on its own.
    expect(mockResolveOfferableAggregates).toHaveBeenCalledWith({
      capability: numericCapability,
      isGroupKey: false,
    });
  });
});
