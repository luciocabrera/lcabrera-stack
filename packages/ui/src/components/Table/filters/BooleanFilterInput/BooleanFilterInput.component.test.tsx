// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  BooleanFilter,
  EmptyFilter,
} from '#ui/types/filterOperators.types';

import { BooleanFilterInput } from './BooleanFilterInput.component';

afterEach(cleanup);

const button = (name: string) => screen.getByRole('button', { name });

describe('BooleanFilterInput', () => {
  it('marks "All" active and clears the filter when no filter is set', () => {
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={undefined} onChange={onChange} />);

    fireEvent.click(button('All'));
    expect(onChange).toHaveBeenCalledWith();
  });

  it('emits a true boolean filter when "True" is picked', () => {
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={undefined} onChange={onChange} />);

    fireEvent.click(button('True'));

    expect(onChange).toHaveBeenCalledWith({ type: 'boolean', value: true });
  });

  it('emits a false boolean filter when "False" is picked', () => {
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={undefined} onChange={onChange} />);

    fireEvent.click(button('False'));

    expect(onChange).toHaveBeenCalledWith({ type: 'boolean', value: false });
  });

  it('reflects a true filter and clears it when "All" is chosen', () => {
    const filter: BooleanFilter = { type: 'boolean', value: true };
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={filter} onChange={onChange} />);

    fireEvent.click(button('All'));

    expect(onChange).toHaveBeenCalledWith();
  });

  it('reflects a false filter and lets the user switch to true', () => {
    const filter: BooleanFilter = { type: 'boolean', value: false };
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={filter} onChange={onChange} />);

    fireEvent.click(button('True'));

    expect(onChange).toHaveBeenCalledWith({ type: 'boolean', value: true });
  });

  it('emits an empty filter when "Is empty" is picked', () => {
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={undefined} onChange={onChange} />);

    fireEvent.click(button('Is empty'));

    expect(onChange).toHaveBeenCalledWith({
      operator: 'isEmpty',
      type: 'empty',
    });
  });

  it('emits a not-empty filter when "Is not empty" is picked', () => {
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={undefined} onChange={onChange} />);

    fireEvent.click(button('Is not empty'));

    expect(onChange).toHaveBeenCalledWith({
      operator: 'isNotEmpty',
      type: 'empty',
    });
  });

  it('marks the active empty operator rather than falling back to "All"', () => {
    const filter: EmptyFilter = { operator: 'isNotEmpty', type: 'empty' };
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={filter} onChange={onChange} />);

    expect(button('Is not empty').className).not.toBe(
      button('Is empty').className,
    );
    expect(button('All').className).toBe(button('Is empty').className);
  });

  it('clears an empty filter through "All"', () => {
    const filter: EmptyFilter = { operator: 'isEmpty', type: 'empty' };
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={filter} onChange={onChange} />);

    fireEvent.click(button('All'));

    expect(onChange).toHaveBeenCalledWith();
  });
});
