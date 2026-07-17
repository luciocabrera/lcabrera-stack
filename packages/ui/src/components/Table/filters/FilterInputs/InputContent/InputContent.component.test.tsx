// @vitest-environment jsdom
import type { TableColumnDataType } from '@repo/ui/components/Table/Table.types';
import type {
  ColumnFilter,
  OperatorType,
} from '@repo/ui/types/filterOperators.types';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputContent } from './InputContent.component';

afterEach(cleanup);

type MockTextOrSelectProps = MockTypedInputProps & {
  readonly hasFetchableOptions?: boolean;
  readonly listMaxHeight?: string;
  readonly shouldFillHeight?: boolean;
};

type MockTypedInputProps = {
  readonly filter?: unknown;
  readonly operator: string;
};

const { MockDateFilterInput, MockNumberFilterInput, MockTextOrSelect } =
  vi.hoisted(() => ({
    MockDateFilterInput: ({ filter, operator }: MockTypedInputProps) => (
      <div data-testid='date-input'>
        <span data-testid='date-input-operator'>{operator}</span>
        <span data-testid='date-input-filter'>
          {filter === undefined ? 'no-filter' : JSON.stringify(filter)}
        </span>
      </div>
    ),
    MockNumberFilterInput: ({ filter, operator }: MockTypedInputProps) => (
      <div data-testid='number-input'>
        <span data-testid='number-input-operator'>{operator}</span>
        <span data-testid='number-input-filter'>
          {filter === undefined ? 'no-filter' : JSON.stringify(filter)}
        </span>
      </div>
    ),
    MockTextOrSelect: ({
      filter,
      hasFetchableOptions,
      listMaxHeight,
      operator,
      shouldFillHeight,
    }: MockTextOrSelectProps) => (
      <div data-testid='text-or-select-input'>
        <span data-testid='text-or-select-input-operator'>{operator}</span>
        <span data-testid='text-or-select-input-filter'>
          {filter === undefined ? 'no-filter' : JSON.stringify(filter)}
        </span>
        <span data-testid='text-or-select-input-flags'>
          {`fetchable:${String(hasFetchableOptions)}|maxHeight:${String(listMaxHeight)}|fill:${String(shouldFillHeight)}`}
        </span>
      </div>
    ),
  }));

vi.mock('../../DateFilterInput', () => ({
  DateFilterInput: MockDateFilterInput,
}));

vi.mock('../../NumberFilterInput', () => ({
  NumberFilterInput: MockNumberFilterInput,
}));

vi.mock('./TextOrSelectFilterInput/TextOrSelectFilterInput.component', () => ({
  TextOrSelectFilterInput: MockTextOrSelect,
}));

type Row = { readonly amount: number };

const renderContent = ({
  dataType,
  filter,
  hasFetchableOptions = false,
  listMaxHeight,
  onChange = vi.fn(),
  operator = 'equals',
  shouldFillHeight,
}: {
  readonly dataType?: TableColumnDataType;
  readonly filter?: ColumnFilter;
  readonly hasFetchableOptions?: boolean;
  readonly listMaxHeight?: string;
  readonly onChange?: (filter?: ColumnFilter) => void;
  readonly operator?: OperatorType;
  readonly shouldFillHeight?: boolean;
}) =>
  render(
    <InputContent<Row>
      columnKey='amount'
      dataType={dataType}
      filter={filter}
      hasFetchableOptions={hasFetchableOptions}
      listMaxHeight={listMaxHeight}
      onChange={onChange}
      operator={operator}
      shouldFillHeight={shouldFillHeight}
    />,
  );

describe('InputContent', () => {
  describe('data type dispatch', () => {
    it('renders the number input for number columns', () => {
      renderContent({ dataType: 'number', operator: 'greaterThan' });

      expect(screen.getByTestId('number-input')).not.toBeNull();
      expect(screen.queryByTestId('date-input')).toBeNull();
      expect(screen.queryByTestId('text-or-select-input')).toBeNull();
      expect(screen.getByTestId('number-input-operator').textContent).toBe(
        'greaterThan',
      );
    });

    it('renders the number input for currency columns', () => {
      renderContent({ dataType: 'currency' });

      expect(screen.getByTestId('number-input')).not.toBeNull();
    });

    it('renders the date input for date columns', () => {
      renderContent({ dataType: 'date', operator: 'before' });

      expect(screen.getByTestId('date-input')).not.toBeNull();
      expect(screen.queryByTestId('number-input')).toBeNull();
      expect(screen.getByTestId('date-input-operator').textContent).toBe(
        'before',
      );
    });

    it('renders the text/select input for string columns', () => {
      renderContent({ dataType: 'string', operator: 'contains' });

      expect(screen.getByTestId('text-or-select-input')).not.toBeNull();
      expect(
        screen.getByTestId('text-or-select-input-operator').textContent,
      ).toBe('contains');
    });

    it('renders the text/select input when the data type is undefined', () => {
      renderContent({});

      expect(screen.getByTestId('text-or-select-input')).not.toBeNull();
    });

    it('renders the text/select input for boolean columns via the default branch', () => {
      renderContent({ dataType: 'boolean' });

      expect(screen.getByTestId('text-or-select-input')).not.toBeNull();
    });
  });

  describe('filter narrowing', () => {
    it('forwards a number filter to the number input', () => {
      renderContent({
        dataType: 'number',
        filter: { operator: 'equals', type: 'number', value: 42 },
      });

      expect(screen.getByTestId('number-input-filter').textContent).toBe(
        JSON.stringify({ operator: 'equals', type: 'number', value: 42 }),
      );
    });

    it('drops a mismatched filter type on the number input', () => {
      renderContent({
        dataType: 'number',
        filter: { operator: 'contains', type: 'text', value: 'abc' },
      });

      expect(screen.getByTestId('number-input-filter').textContent).toBe(
        'no-filter',
      );
    });

    it('forwards a date filter to the date input', () => {
      renderContent({
        dataType: 'date',
        filter: { operator: 'after', type: 'date', value: '2026-01-01' },
      });

      expect(screen.getByTestId('date-input-filter').textContent).toBe(
        JSON.stringify({
          operator: 'after',
          type: 'date',
          value: '2026-01-01',
        }),
      );
    });

    it('drops a mismatched filter type on the date input', () => {
      renderContent({
        dataType: 'date',
        filter: { operator: 'equals', type: 'number', value: 1 },
      });

      expect(screen.getByTestId('date-input-filter').textContent).toBe(
        'no-filter',
      );
    });

    it('forwards the filter unnarrowed to the text/select input', () => {
      renderContent({
        dataType: 'string',
        filter: { type: 'select', value: 'alpha' },
      });

      expect(
        screen.getByTestId('text-or-select-input-filter').textContent,
      ).toBe(JSON.stringify({ type: 'select', value: 'alpha' }));
    });
  });

  describe('presentation flags', () => {
    it('forwards list sizing flags to the text/select input', () => {
      renderContent({
        dataType: 'string',
        hasFetchableOptions: true,
        listMaxHeight: '12rem',
        shouldFillHeight: true,
      });

      expect(screen.getByTestId('text-or-select-input-flags').textContent).toBe(
        'fetchable:true|maxHeight:12rem|fill:true',
      );
    });

    it('defaults shouldFillHeight to false', () => {
      renderContent({ dataType: 'string' });

      expect(screen.getByTestId('text-or-select-input-flags').textContent).toBe(
        'fetchable:false|maxHeight:undefined|fill:false',
      );
    });
  });
});
