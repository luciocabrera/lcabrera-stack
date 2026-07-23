// @vitest-environment jsdom
import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TextOrSelectFilterInput } from './TextOrSelectFilterInput.component';

afterEach(cleanup);

const selectFixture = vi.hoisted(() => ({
  operator: 'equals',
  type: 'select',
  value: 'alpha',
}));

const MockSelectFilterInput = vi.hoisted(() => {
  return function MockSelectFilterInput({
    onChange,
  }: {
    readonly onChange: (filter?: unknown) => void;
  }) {
    return (
      <div>
        <button
          onClick={() => {
            onChange(selectFixture);
          }}
          type='button'
        >
          pick-option
        </button>
        <button
          onClick={() => {
            onChange();
          }}
          type='button'
        >
          clear-option
        </button>
      </div>
    );
  };
});

const MockTextFilterInput = vi.hoisted(() => {
  return function MockTextFilterInput() {
    return <input aria-label='text-filter' />;
  };
});

vi.mock('../../../SelectFilterInput', () => ({
  SelectFilterInput: MockSelectFilterInput,
}));

vi.mock('../../../TextFilterInput', () => ({
  TextFilterInput: MockTextFilterInput,
}));

type Row = { readonly name: string };

const renderInput = ({
  hasFetchableOptions = true,
  onChange = vi.fn(),
  operator = 'equals' as const,
}: {
  readonly hasFetchableOptions?: boolean;
  readonly onChange?: (filter?: ColumnFilter) => void;
  readonly operator?: 'contains' | 'equals' | 'notEquals';
} = {}) =>
  render(
    <TextOrSelectFilterInput<Row>
      columnKey='name'
      hasFetchableOptions={hasFetchableOptions}
      onChange={onChange}
      operator={operator}
      shouldFillHeight={false}
    />,
  );

describe('TextOrSelectFilterInput', () => {
  it('renders the select list for equality operators with fetchable options', () => {
    renderInput();

    expect(screen.getByText('pick-option')).not.toBeNull();
  });

  it('renders the text input without fetchable options', () => {
    renderInput({ hasFetchableOptions: false });

    expect(screen.getByLabelText('text-filter')).not.toBeNull();
  });

  it('renders the text input for non-equality operators', () => {
    renderInput({ operator: 'contains' });

    expect(screen.getByLabelText('text-filter')).not.toBeNull();
  });

  it('maps the selection onto the active operator', () => {
    const onChange = vi.fn();
    renderInput({ onChange, operator: 'notEquals' });

    fireEvent.click(screen.getByText('pick-option'));

    expect(onChange).toHaveBeenCalledWith({
      ...selectFixture,
      operator: 'notEquals',
    });
  });

  it('clears the filter when the selection is cleared', () => {
    const onChange = vi.fn();
    renderInput({ onChange });

    fireEvent.click(screen.getByText('clear-option'));

    expect(onChange).toHaveBeenCalledWith();
  });
});
