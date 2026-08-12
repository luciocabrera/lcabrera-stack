// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { NumberFilter } from '#ui/types/filterOperators.types';

import { NumberFilterInput } from './NumberFilterInput.component';

type Row = { readonly amount: number };

afterEach(cleanup);

describe('NumberFilterInput', () => {
  it('renders a single number input for a non-between operator', () => {
    render(
      <NumberFilterInput<Row>
        columnKey='amount'
        filter={undefined}
        onChange={vi.fn()}
        operator='equals'
      />,
    );

    const inputs = screen.getAllByRole<HTMLInputElement>('spinbutton');
    expect(inputs).toHaveLength(1);
    expect(inputs[0]?.placeholder).toBe('Enter number...');
  });

  it('parses a typed entry into a number and emits it with the operator', () => {
    const onChange = vi.fn();

    render(
      <NumberFilterInput<Row>
        columnKey='amount'
        filter={undefined}
        onChange={onChange}
        operator='greaterThan'
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '25' },
    });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'greaterThan',
      type: 'number',
      value: 25,
    });
  });

  it('emits an undefined value when a single input is cleared', () => {
    const filter: NumberFilter = {
      operator: 'equals',
      type: 'number',
      value: 7,
    };
    const onChange = vi.fn();

    render(
      <NumberFilterInput<Row>
        columnKey='amount'
        filter={filter}
        onChange={onChange}
        operator='equals'
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'equals',
      type: 'number',
      value: undefined,
    });
  });

  it('renders Min and Max inputs seeded from a between filter', () => {
    const filter: NumberFilter = {
      operator: 'between',
      type: 'number',
      value: 10,
      value2: 20,
    };

    render(
      <NumberFilterInput<Row>
        columnKey='amount'
        filter={filter}
        onChange={vi.fn()}
        operator='between'
      />,
    );

    const [min, max] = screen.getAllByRole<HTMLInputElement>('spinbutton');
    expect(min?.value).toBe('10');
    expect(max?.value).toBe('20');
    expect(screen.getByText('to')).not.toBeNull();
  });

  it('carries the existing lower bound when only the upper bound changes', () => {
    const filter: NumberFilter = {
      operator: 'between',
      type: 'number',
      value: 10,
      value2: 20,
    };
    const onChange = vi.fn();

    render(
      <NumberFilterInput<Row>
        columnKey='amount'
        filter={filter}
        onChange={onChange}
        operator='between'
      />,
    );

    const max = screen.getByPlaceholderText('Max');
    fireEvent.change(max, { target: { value: '30' } });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'between',
      type: 'number',
      value: 10,
      value2: 30,
    });
  });

  it('drops the upper bound to undefined when the Max input is cleared', () => {
    const filter: NumberFilter = {
      operator: 'between',
      type: 'number',
      value: 10,
      value2: 20,
    };
    const onChange = vi.fn();

    render(
      <NumberFilterInput<Row>
        columnKey='amount'
        filter={filter}
        onChange={onChange}
        operator='between'
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Max'), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'between',
      type: 'number',
      value: 10,
      value2: undefined,
    });
  });
});
