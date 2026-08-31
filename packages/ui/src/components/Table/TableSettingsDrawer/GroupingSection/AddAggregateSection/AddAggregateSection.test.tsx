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

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '#ui/components/Table/Table.constants';

import { AGGREGATE_PICKER_GAP_MESSAGES } from './AddAggregateSection.constants';

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

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count', 'Sum']);
  });

  it('offers a different set for a column of a different real type', () => {
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
    groupingKeysRef.current = ['order_status'];

    render(<AddAggregateSection />);

    expect(listed(COLUMN_PLACEHOLDER)).toEqual(['Total']);
  });

  it('empties the function list when the chosen column becomes a group key', () => {
    const { rerender } = render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count', 'Sum']);

    groupingKeysRef.current = ['total_amount'];
    rerender(<AddAggregateSection />);

    expect(listed(COLUMN_PLACEHOLDER)).toEqual(['Status']);
    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([]);
  });

  it('does not offer a function the chosen column already carries', () => {
    aggregatesRef.current = [{ columnKey: 'total_amount', fn: 'sum' }];

    render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    expect(listed(FUNCTION_PLACEHOLDER)).toEqual(['Count']);
  });

  it('subtracts only what the *chosen* column carries', () => {
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
    const { rerender } = render(<AddAggregateSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Total' }));

    groupingKeysRef.current = ['total_amount'];
    rerender(<AddAggregateSection />);

    expect(screen.queryByText(/already applied/)).toBeNull();
    expect(listed(FUNCTION_PLACEHOLDER)).toEqual([]);
  });

  it('does not offer a second distinct count while another column carries one', () => {
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
    expect(
      screen.getByText(AGGREGATE_PICKER_GAP_MESSAGES['count-distinct-spent']),
    ).not.toBeNull();
    expect(AGGREGATE_PICKER_GAP_MESSAGES['count-distinct-spent']).toContain(
      String(MAX_TABLE_COUNT_DISTINCT_AGGREGATES),
    );
    expect(screen.queryByText(/already applied/)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('says the column is fully measured when it carries that distinct count itself', () => {
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
    expect(screen.queryByText(/carries at most/)).toBeNull();
  });

  it('refuses to add a function that stopped being addable under it', () => {
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
