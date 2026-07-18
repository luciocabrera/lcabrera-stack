// @vitest-environment jsdom

import type { DateFilter } from '@repo/ui/types/filterOperators.types';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DateFilterInput } from './DateFilterInput.component';

afterEach(cleanup);

const dateInputs = () => [
  ...document.querySelectorAll<HTMLInputElement>('input[type="date"]'),
];

describe('DateFilterInput', () => {
  it('renders a single date input for a non-between operator', () => {
    render(
      <DateFilterInput
        columnKey='createdAt'
        filter={undefined}
        onChange={vi.fn()}
        operator='after'
      />,
    );

    const inputs = dateInputs();
    expect(inputs).toHaveLength(1);
    expect(inputs[0]?.value).toBe('');
  });

  it('emits a date filter with the controlled operator on change', () => {
    const onChange = vi.fn();

    render(
      <DateFilterInput
        columnKey='createdAt'
        filter={undefined}
        onChange={onChange}
        operator='before'
      />,
    );

    fireEvent.change(dateInputs()[0] as HTMLInputElement, {
      target: { value: '2024-06-01' },
    });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'before',
      type: 'date',
      value: '2024-06-01',
    });
  });

  it('renders two date inputs seeded from a between filter', () => {
    const filter: DateFilter = {
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: '2024-12-31',
    };

    render(
      <DateFilterInput
        columnKey='createdAt'
        filter={filter}
        onChange={vi.fn()}
        operator='between'
      />,
    );

    const [start, end] = dateInputs();
    expect(start?.value).toBe('2024-01-01');
    expect(end?.value).toBe('2024-12-31');
    expect(screen.getByText('to')).not.toBeNull();
  });

  it('keeps the start date when only the end date changes in a between filter', () => {
    const filter: DateFilter = {
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: '2024-12-31',
    };
    const onChange = vi.fn();

    render(
      <DateFilterInput
        columnKey='createdAt'
        filter={filter}
        onChange={onChange}
        operator='between'
      />,
    );

    fireEvent.change(dateInputs()[1] as HTMLInputElement, {
      target: { value: '2025-01-15' },
    });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: '2025-01-15',
    });
  });

  it('emits an undefined upper bound when the end date is cleared', () => {
    const filter: DateFilter = {
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: '2024-12-31',
    };
    const onChange = vi.fn();

    render(
      <DateFilterInput
        columnKey='createdAt'
        filter={filter}
        onChange={onChange}
        operator='between'
      />,
    );

    fireEvent.change(dateInputs()[1] as HTMLInputElement, {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: undefined,
    });
  });
});
