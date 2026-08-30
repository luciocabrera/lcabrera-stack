import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

// @vitest-environment jsdom
import type { TableColumn } from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { FilterInputs } from './FilterInputs.component';

afterEach(cleanup);

type Row = { readonly status: string };

const { MockBooleanFilterInput, MockInputContent, MockOperatorSelect } =
  vi.hoisted(() => ({
    MockBooleanFilterInput: ({ filter }: { readonly filter?: unknown }) => (
      <div data-testid='boolean-input'>
        {filter === undefined ? 'no-filter' : JSON.stringify(filter)}
      </div>
    ),
    MockInputContent: ({
      dataType,
      filter,
      hasFetchableOptions,
      listMaxHeight,
      operator,
      shouldFillHeight,
    }: {
      readonly dataType?: string;
      readonly filter?: unknown;
      readonly hasFetchableOptions: boolean;
      readonly listMaxHeight?: string;
      readonly operator: string;
      readonly shouldFillHeight?: boolean;
    }) => (
      <div data-testid='input-content'>
        <span data-testid='input-content-operator'>{operator}</span>
        <span data-testid='input-content-props'>
          {`dataType:${String(dataType)}|fetchable:${String(hasFetchableOptions)}|maxHeight:${String(listMaxHeight)}|fill:${String(shouldFillHeight)}`}
        </span>
        <span data-testid='input-content-filter'>
          {filter === undefined ? 'no-filter' : JSON.stringify(filter)}
        </span>
      </div>
    ),
    MockOperatorSelect: ({
      dataType,
      onOpenChange,
    }: {
      readonly dataType?: string;
      readonly onOpenChange: (isOpen: boolean) => void;
    }) => (
      <div data-testid='operator-select'>
        <span data-testid='operator-select-datatype'>{String(dataType)}</span>
        <button
          onClick={() => {
            onOpenChange(true);
          }}
          type='button'
        >
          open-operators
        </button>
        <button
          onClick={() => {
            onOpenChange(false);
          }}
          type='button'
        >
          close-operators
        </button>
      </div>
    ),
  }));

const { useGetDeclaredColumnMock } = vi.hoisted(() => ({
  useGetDeclaredColumnMock: vi.fn(),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetDeclaredColumn.hook',
  () => ({
    useGetDeclaredColumn: useGetDeclaredColumnMock,
  }),
);

vi.mock('../BooleanFilterInput', () => ({
  BooleanFilterInput: MockBooleanFilterInput,
}));

vi.mock('./InputContent', () => ({
  InputContent: MockInputContent,
}));

vi.mock('./OperatorSelect/OperatorSelect.component', () => ({
  OperatorSelect: MockOperatorSelect,
}));

const renderFilterInputs = ({
  column,
  filter,
  listMaxHeight,
  onChange = vi.fn(),
  shouldFillHeight,
}: {
  readonly column: TableColumn<Row>;
  readonly filter?: ColumnFilter;
  readonly listMaxHeight?: string;
  readonly onChange?: (filter?: ColumnFilter) => void;
  readonly shouldFillHeight?: boolean;
}) => {
  useGetDeclaredColumnMock.mockReturnValue(column);

  return render(
    <FilterInputs<Row>
      columnKey='status'
      filter={filter}
      listMaxHeight={listMaxHeight}
      onChange={onChange}
      shouldFillHeight={shouldFillHeight}
    />,
  );
};

/**
 * `Activity mode='hidden'` keeps children mounted and marks the host element
 * `display: none !important`; `mode='visible'` leaves the display untouched.
 */
const isInputContentVisible = () =>
  screen.getByTestId('input-content').style.display !== 'none';

const stringColumn: TableColumn<Row> = {
  dataType: 'string',
  key: 'status',
  label: 'Status',
};

const booleanColumn: TableColumn<Row> = {
  dataType: 'boolean',
  key: 'status',
  label: 'Status',
};

describe('FilterInputs', () => {
  describe('boolean columns', () => {
    it('renders only the boolean input, bypassing the operator select', () => {
      renderFilterInputs({ column: booleanColumn });

      expect(screen.getByTestId('boolean-input')).not.toBeNull();
      expect(screen.queryByTestId('operator-select')).toBeNull();
      expect(screen.queryByTestId('input-content')).toBeNull();
    });

    it('forwards a boolean filter to the boolean input', () => {
      renderFilterInputs({
        column: booleanColumn,
        filter: { type: 'boolean', value: true },
      });

      expect(screen.getByTestId('boolean-input').textContent).toBe(
        JSON.stringify({ type: 'boolean', value: true }),
      );
    });

    it('forwards an empty filter to the boolean input', () => {
      // A boolean column has no operator dropdown, so the boolean input is the
      // only surface that can show or clear an empty filter on one. Dropping it
      // here left the control reading "All" while the table was filtered to the
      // null rows — the wrong rows under a control that denied filtering them.
      renderFilterInputs({
        column: booleanColumn,
        filter: { operator: 'isEmpty', type: 'empty' },
      });

      expect(screen.getByTestId('boolean-input').textContent).toBe(
        JSON.stringify({ operator: 'isEmpty', type: 'empty' }),
      );
    });

    it('drops a non-boolean filter on a boolean column', () => {
      renderFilterInputs({
        column: booleanColumn,
        filter: { operator: 'contains', type: 'text', value: 'abc' },
      });

      expect(screen.getByTestId('boolean-input').textContent).toBe('no-filter');
    });
  });

  describe('non-boolean columns without fill height', () => {
    it('renders the operator select but no input until a filter exists', () => {
      renderFilterInputs({ column: stringColumn });

      expect(screen.getByTestId('operator-select')).not.toBeNull();
      expect(screen.getByTestId('operator-select-datatype').textContent).toBe(
        'string',
      );
      expect(screen.queryByTestId('input-content')).toBeNull();
    });

    it('renders the input once a filter exists', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'contains', type: 'text', value: 'abc' },
      });

      expect(screen.getByTestId('input-content')).not.toBeNull();
    });

    it('keeps the input mounted but visually hidden while the operator list is open', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'contains', type: 'text', value: 'abc' },
      });

      const wrapperBefore =
        screen.getByTestId('input-content').parentElement?.className ?? '';

      fireEvent.click(screen.getByText('open-operators'));

      const wrapperOpen =
        screen.getByTestId('input-content').parentElement?.className ?? '';

      expect(wrapperOpen).not.toBe(wrapperBefore);
      expect(wrapperOpen.length).toBeGreaterThan(0);

      fireEvent.click(screen.getByText('close-operators'));

      expect(
        screen.getByTestId('input-content').parentElement?.className ?? '',
      ).toBe(wrapperBefore);
    });
  });

  describe('non-boolean columns with fill height', () => {
    it('hides the input via Activity while no filter exists', () => {
      renderFilterInputs({ column: stringColumn, shouldFillHeight: true });

      expect(screen.getByTestId('operator-select')).not.toBeNull();
      expect(isInputContentVisible()).toBe(false);
    });

    it('shows the input once a filter exists', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'contains', type: 'text', value: 'abc' },
        shouldFillHeight: true,
      });

      expect(isInputContentVisible()).toBe(true);
    });

    it('hides the input again while the operator list is open', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'contains', type: 'text', value: 'abc' },
        shouldFillHeight: true,
      });

      fireEvent.click(screen.getByText('open-operators'));

      expect(isInputContentVisible()).toBe(false);

      fireEvent.click(screen.getByText('close-operators'));

      expect(isInputContentVisible()).toBe(true);
    });

    it('forwards fill height to the input', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'contains', type: 'text', value: 'abc' },
        shouldFillHeight: true,
      });

      expect(screen.getByTestId('input-content-props').textContent).toContain(
        'fill:true',
      );
    });
  });

  describe('props derived for the input', () => {
    it('derives the operator from the active filter', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'startsWith', type: 'text', value: 'ab' },
      });

      expect(screen.getByTestId('input-content-operator').textContent).toBe(
        'startsWith',
      );
    });

    it('falls back to the equals operator for a filter without one', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { type: 'select', value: 'alpha' },
      });

      expect(screen.getByTestId('input-content-operator').textContent).toBe(
        'equals',
      );
    });

    it('marks options as fetchable when the column has a filter options descriptor', () => {
      renderFilterInputs({
        column: {
          ...stringColumn,
          filterOptionsDescriptor: { kind: 'static', values: ['Open'] },
        },
        filter: { operator: 'equals', type: 'text', value: '' },
        listMaxHeight: '12rem',
      });

      expect(screen.getByTestId('input-content-props').textContent).toBe(
        'dataType:string|fetchable:true|maxHeight:12rem|fill:false',
      );
    });

    it('marks options as not fetchable without a descriptor', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'equals', type: 'text', value: '' },
      });

      expect(screen.getByTestId('input-content-props').textContent).toContain(
        'fetchable:false',
      );
    });

    it('passes the filter through to the input untouched', () => {
      renderFilterInputs({
        column: stringColumn,
        filter: { operator: 'equals', type: 'number', value: 7 },
      });

      expect(screen.getByTestId('input-content-filter').textContent).toBe(
        JSON.stringify({ operator: 'equals', type: 'number', value: 7 }),
      );
    });
  });
});
