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

import type {
  TableColumnAggregate,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

type MockVirtualSelectProps = {
  readonly onChange: (values: readonly string[]) => void;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly placeholder: string;
};

const {
  aggregatesRef,
  capabilitiesRef,
  columnsRef,
  groupingKeysRef,
  mockAddColumnAggregate,
} = vi.hoisted(() => ({
  aggregatesRef: { current: [] as readonly TableColumnAggregate[] },
  capabilitiesRef: { current: {} as Record<string, unknown> },
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  groupingKeysRef: { current: [] as readonly string[] },
  mockAddColumnAggregate: vi.fn(),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('../../TableDrawerContext/actions', () => ({
  useAddColumnAggregate: () => mockAddColumnAggregate,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingAggregates: () => aggregatesRef.current,
  useGetGroupingKeys: () => groupingKeysRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableGroupingCapabilities: () => capabilitiesRef.current,
}));

vi.mock('#ui/components/VirtualSelect', () => ({
  VirtualSelect: ({
    onChange,
    options,
    placeholder,
  }: MockVirtualSelectProps) => (
    <ul data-testid={placeholder}>
      {options.map((option) => (
        <li key={option.value}>
          <button
            onClick={() => {
              onChange([option.value]);
            }}
            type='button'
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

import { AddAggregateSection } from './AddAggregateSection.component';

const COLUMN_PLACEHOLDER = 'Select a column...';
const FUNCTION_PLACEHOLDER = 'Select a function...';

const listed = (placeholder: string) =>
  [...screen.getByTestId(placeholder).children].map((node) => node.textContent);

const numericCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

const textCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column: 'order_status',
  periods: [],
  role: 'dimension',
  typeName: 'text',
};

beforeEach(() => {
  aggregatesRef.current = [];
  groupingKeysRef.current = [];
  columnsRef.current = [
    { key: 'order_status', label: 'Status' },
    // Declared `string` on purpose: this is the `numeric` column the
    // presentation vocabulary reports as text (#550). Only the catalogue knows.
    { dataType: 'string', key: 'total_amount', label: 'Total' },
    { key: 'doc', label: 'Document' },
  ];
  capabilitiesRef.current = {
    doc: {
      aggregates: [],
      canGroup: false,
      column: 'doc',
      periods: [],
      refusal: 'not-a-dimension',
      role: 'unsupported',
      typeName: 'jsonb',
    },
    order_status: textCapability,
    total_amount: numericCapability,
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AddAggregateSection', () => {
  it('offers only the columns the catalogue can aggregate', () => {
    render(<AddAggregateSection />);

    expect(listed(COLUMN_PLACEHOLDER)).toEqual(['Status', 'Total']);
  });

  it('offers no function until a column is chosen', () => {
    render(<AddAggregateSection />);

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([]);
  });

  it("offers exactly the functions legal for the chosen column's real type", () => {
    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    // `sum` on a column the presentation vocabulary calls a string, and no
    // `min`/`max` — the catalogue's answer, not the declared type's.
    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count', 'Sum']);
  });

  it('offers a different set for a column of a different real type', () => {
    // The discriminating half: if the menu were shaped from anything but the
    // per-column capability, these two would be the same list.
    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([
      'Count',
      'Distinct Count',
      'Minimum',
      'Maximum',
    ]);
  });

  it('applies the chosen aggregate to the chosen column', () => {
    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sum' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockAddColumnAggregate).toHaveBeenCalledWith({
      columnKey: 'total_amount',
      fn: 'sum',
    });
  });

  it('drops a chosen function when the column changes under it', () => {
    // `sum` is legal for `total_amount` and not for `order_status`, so keeping
    // it would offer a combination the server refuses.
    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sum' }));
    fireEvent.click(screen.getByRole('button', { name: 'Status' }));

    expect(
      screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('offers nothing at all when the route resolved no capabilities', () => {
    capabilitiesRef.current = {};

    render(<AddAggregateSection />);

    expect(listed(COLUMN_PLACEHOLDER)).toEqual([]);
  });

  it('does not offer a column staged as a group key', () => {
    // A grouped column renders its key's value rather than a measure
    // (ADR-080), so an aggregate chosen on it could never be shown.
    groupingKeysRef.current = ['order_status'];

    render(<AddAggregateSection />);

    expect(listed(COLUMN_PLACEHOLDER)).toEqual(['Total']);
  });

  it('empties the function list when the chosen column becomes a group key', () => {
    // Both lists ask the same question of the same predicate, so staging the
    // selected column as a key has to close both — leaving the functions up
    // would offer an aggregate on a column the picker no longer offers.
    const { rerender } = render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count', 'Sum']);

    groupingKeysRef.current = ['total_amount'];
    rerender(<AddAggregateSection />);

    expect(listed(COLUMN_PLACEHOLDER)).toEqual(['Status']);
    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([]);
  });

  it('does not offer a function the chosen column already carries', () => {
    // Adding is an append with a duplicate guard (#831), so re-picking an
    // applied function is accepted and then does nothing visible — which is
    // indistinguishable from a bug, so it is not offered (#841).
    aggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];

    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count']);
  });

  it('subtracts only what the *chosen* column carries', () => {
    // The discriminating half: a subtraction blind to the column would drop
    // `Count` here too, on the strength of another column's aggregate — and a
    // column key does repeat across the staged list (#831).
    aggregatesRef.current = [{ columnKey: 'order_status', fn: 'count' }];

    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count', 'Sum']);
  });

  it('offers the function again once that aggregate is cleared', () => {
    aggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];

    const { rerender } = render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count']);

    aggregatesRef.current = [];
    rerender(<AddAggregateSection />);

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count', 'Sum']);
  });

  it('says so when the column carries every function it supports', () => {
    // The column list still offers such a column — it excludes group keys and
    // unaggregatable columns, not exhausted ones (#830) — so the picker has to
    // account for itself rather than render an empty control.
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'count' },
      { columnKey: 'total_amount', fn: 'sum' },
    ];

    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    expect(screen.queryByTestId(FUNCTION_PLACEHOLDER)).toBeNull();
    expect(screen.getByText(/already applied/)).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('says nothing when the list empties for any other reason', () => {
    // Exhaustion is not the only way the functions run out, and the other way
    // has nothing to tell the user: the column stopped being aggregatable at
    // all (ADR-080), so "remove one to add another" would answer a question
    // nobody asked.
    const { rerender } = render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    groupingKeysRef.current = ['total_amount'];
    rerender(<AddAggregateSection />);

    expect(screen.queryByText(/already applied/)).toBeNull();
    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([]);
  });

  it('does not offer a second distinct count while another column carries one', () => {
    // The cap is per read rather than per column, so an aggregate staged on
    // `total_amount` is what closes the offer on `order_status` (#842).
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'countDistinct' },
    ];

    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([
      'Count',
      'Minimum',
      'Maximum',
    ]);
  });

  it('offers the distinct count again once that one is cleared', () => {
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'countDistinct' },
    ];

    const { rerender } = render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));

    expect(listed(FUNCTION_PLACEHOLDER)).not.toContain('Distinct Count');

    aggregatesRef.current = [];
    rerender(<AddAggregateSection />);

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([
      'Count',
      'Distinct Count',
      'Minimum',
      'Maximum',
    ]);
  });

  it('says the read has no room when that is what emptied the list', () => {
    // `Distinct Count` is still legal on this column, so it is not fully
    // measured and the #841 message would send the user to the wrong control:
    // the measure to remove is the one on `total_amount`.
    capabilitiesRef.current = {
      ...capabilitiesRef.current,
      order_status: {
        ...textCapability,
        aggregates: ['count', 'countDistinct'],
      },
    };
    aggregatesRef.current = [
      { columnKey: 'total_amount', fn: 'countDistinct' },
      { columnKey: 'order_status', fn: 'count' },
    ];

    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));

    expect(screen.queryByTestId(FUNCTION_PLACEHOLDER)).toBeNull();
    expect(screen.getByText(/Distinct Count fits/)).not.toBeNull();
    expect(screen.queryByText(/already applied/)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('says the column is fully measured when it carries that distinct count itself', () => {
    // The discriminating half of the pair above: the same two functions, both
    // staged on the chosen column, so the budget is spent by the column asking.
    // Nothing is withheld from it, and the user is sent to its own measures.
    capabilitiesRef.current = {
      ...capabilitiesRef.current,
      order_status: {
        ...textCapability,
        aggregates: ['count', 'countDistinct'],
      },
    };
    aggregatesRef.current = [
      { columnKey: 'order_status', fn: 'countDistinct' },
      { columnKey: 'order_status', fn: 'count' },
    ];

    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));

    expect(screen.getByText(/already applied/)).not.toBeNull();
    expect(screen.queryByText(/Distinct Count fits/)).toBeNull();
  });

  it('refuses to add a function that stopped being addable under it', () => {
    // The staged list moves under a held selection — the list beside this
    // control removes and the header menu writes live — so the Add button acts
    // on what the picker currently offers, not on the raw selection.
    const { rerender } = render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sum' }));

    aggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];
    rerender(<AddAggregateSection />);

    expect(
      screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled'),
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockAddColumnAggregate).not.toHaveBeenCalled();
  });
});
