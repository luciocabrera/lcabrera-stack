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

import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

type MockVirtualSelectProps = {
  readonly onChange: (values: readonly string[]) => void;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
  readonly placeholder: string;
};

const { capabilitiesRef, columnsRef, mockSetColumnAggregate } = vi.hoisted(
  () => ({
    capabilitiesRef: { current: {} as Record<string, unknown> },
    columnsRef: { current: [] as readonly Record<string, unknown>[] },
    mockSetColumnAggregate: vi.fn(),
  }),
);

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('../../TableDrawerContext/actions', () => ({
  useSetColumnAggregate: () => mockSetColumnAggregate,
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
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

const textCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column: 'order_status',
  role: 'dimension',
  typeName: 'text',
};

beforeEach(() => {
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

    expect(mockSetColumnAggregate).toHaveBeenCalledWith({
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
});
