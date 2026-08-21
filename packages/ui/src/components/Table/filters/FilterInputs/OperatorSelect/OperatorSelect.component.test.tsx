import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

// @vitest-environment jsdom
import type { TableColumnDataType } from '#ui/components/Table/Table.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { OperatorSelect } from './OperatorSelect.component';

afterEach(cleanup);

type MockVirtualSelectProps = {
  readonly customStylex?: unknown;
  readonly onChange: (selectedLabels: string[]) => void;
  readonly onOpenChange?: (isOpen: boolean) => void;
  readonly options: readonly string[];
  readonly placeholder?: string;
  readonly selected?: readonly string[];
};

const MockVirtualSelect = vi.hoisted(() => {
  return function MockVirtualSelect({
    customStylex,
    onChange,
    onOpenChange,
    options,
    placeholder,
    selected,
  }: MockVirtualSelectProps) {
    return (
      <div>
        <span data-testid='has-custom-stylex'>
          {String(customStylex !== undefined)}
        </span>
        <span data-testid='placeholder'>{placeholder}</span>
        <span data-testid='selected'>{(selected ?? []).join('|')}</span>
        <span data-testid='options'>{options.join('|')}</span>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => {
              onChange([option]);
            }}
            type='button'
          >
            {`pick:${option}`}
          </button>
        ))}
        <button
          onClick={() => {
            onChange([]);
          }}
          type='button'
        >
          pick-none
        </button>
        <button
          onClick={() => {
            onChange(['Not a real operator']);
          }}
          type='button'
        >
          pick-unknown
        </button>
        <button
          onClick={() => {
            onOpenChange?.(true);
          }}
          type='button'
        >
          toggle-open
        </button>
      </div>
    );
  };
});

vi.mock('#ui/components/VirtualSelect', () => ({
  VirtualSelect: MockVirtualSelect,
}));

const renderOperatorSelect = ({
  dataType,
  filter,
  onChange = vi.fn(),
  onOpenChange = vi.fn(),
}: {
  readonly dataType?: TableColumnDataType;
  readonly filter?: ColumnFilter;
  readonly onChange?: (filter: ColumnFilter) => void;
  readonly onOpenChange?: (isOpen: boolean) => void;
} = {}) =>
  render(
    <OperatorSelect
      dataType={dataType}
      filter={filter}
      onChange={onChange}
      onOpenChange={onOpenChange}
    />,
  );

const getOptionLabels = () =>
  screen.getByTestId('options').textContent?.split('|') ?? [];

describe('OperatorSelect', () => {
  describe('operator options per data type', () => {
    it('offers the text operators for string columns', () => {
      renderOperatorSelect({ dataType: 'string' });

      expect(getOptionLabels()).toEqual([
        'Contains',
        'Does not contain',
        'Does not equal',
        'Ends with',
        'Equals',
        'Starts with',
        'Is empty',
        'Is not empty',
      ]);
    });

    it('offers the text operators when the data type is unknown', () => {
      renderOperatorSelect();

      expect(getOptionLabels()).toContain('Contains');
    });

    it('offers the number operators for number columns', () => {
      renderOperatorSelect({ dataType: 'number' });

      expect(getOptionLabels()).toEqual([
        'Between',
        'Equals',
        'Greater than',
        'Greater than or equal',
        'Less than',
        'Less than or equal',
        'Not equals',
        'Is empty',
        'Is not empty',
      ]);
    });

    it('offers the number operators for currency columns', () => {
      renderOperatorSelect({ dataType: 'currency' });

      expect(getOptionLabels()).toContain('Greater than or equal');
    });

    it('offers the date operators for date columns', () => {
      renderOperatorSelect({ dataType: 'date' });

      expect(getOptionLabels()).toEqual([
        'After',
        'Before',
        'Between',
        'Equals',
        'Is empty',
        'Is not empty',
      ]);
    });
  });

  describe('selected operator label', () => {
    it('selects nothing while no filter exists', () => {
      renderOperatorSelect({ dataType: 'string' });

      expect(screen.getByTestId('selected').textContent).toBe('');
      expect(screen.getByTestId('placeholder').textContent).toBe(
        'Select operator...',
      );
    });

    it('reflects the operator of an existing filter', () => {
      renderOperatorSelect({
        dataType: 'string',
        filter: { operator: 'startsWith', type: 'text', value: 'ab' },
      });

      expect(screen.getByTestId('selected').textContent).toBe('Starts with');
    });

    it('falls back to the equals label for a filter without an operator', () => {
      renderOperatorSelect({
        dataType: 'string',
        filter: { type: 'select', value: 'alpha' },
      });

      expect(screen.getByTestId('selected').textContent).toBe('Equals');
    });
  });

  describe('handleOperatorChange', () => {
    it('seeds an empty text filter when none exists yet', () => {
      const onChange = vi.fn();
      renderOperatorSelect({ dataType: 'string', onChange });

      fireEvent.click(screen.getByText('pick:Contains'));

      expect(onChange).toHaveBeenCalledWith({
        operator: 'contains',
        type: 'text',
        value: '',
      });
    });

    it('seeds an empty number filter for number columns', () => {
      const onChange = vi.fn();
      renderOperatorSelect({ dataType: 'number', onChange });

      fireEvent.click(screen.getByText('pick:Greater than'));

      expect(onChange).toHaveBeenCalledWith({
        operator: 'greaterThan',
        type: 'number',
        value: undefined,
      });
    });

    it('seeds an empty date filter for date columns', () => {
      const onChange = vi.fn();
      renderOperatorSelect({ dataType: 'date', onChange });

      fireEvent.click(screen.getByText('pick:Before'));

      expect(onChange).toHaveBeenCalledWith({
        operator: 'before',
        type: 'date',
        value: '',
      });
    });

    it('swaps the operator on an existing filter and keeps its value', () => {
      const onChange = vi.fn();
      renderOperatorSelect({
        dataType: 'string',
        filter: { operator: 'equals', type: 'text', value: 'keep-me' },
        onChange,
      });

      fireEvent.click(screen.getByText('pick:Ends with'));

      expect(onChange).toHaveBeenCalledWith({
        operator: 'endsWith',
        type: 'text',
        value: 'keep-me',
      });
    });

    it('ignores an empty selection', () => {
      const onChange = vi.fn();
      renderOperatorSelect({ dataType: 'string', onChange });

      fireEvent.click(screen.getByText('pick-none'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores a label that matches no known operator', () => {
      const onChange = vi.fn();
      renderOperatorSelect({ dataType: 'string', onChange });

      fireEvent.click(screen.getByText('pick-unknown'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores the change when the active filter is a boolean filter', () => {
      const onChange = vi.fn();
      renderOperatorSelect({
        dataType: 'string',
        filter: { type: 'boolean', value: true },
        onChange,
      });

      fireEvent.click(screen.getByText('pick:Contains'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('passes no style override to the select', () => {
    renderOperatorSelect({ dataType: 'string' });

    // The override it used to pass reset `position`/`left`/`top`, which beat
    // the dropdown's computed placement and parked the list in the viewport's
    // top-left corner. Nothing here may style the dropdown's position.
    expect(screen.getByTestId('has-custom-stylex').textContent).toBe('false');
  });

  it('forwards the dropdown open state to onOpenChange', () => {
    const onOpenChange = vi.fn();
    renderOperatorSelect({ dataType: 'string', onOpenChange });

    fireEvent.click(screen.getByText('toggle-open'));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
