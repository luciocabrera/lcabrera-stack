// @vitest-environment jsdom

import type { BooleanFilter } from '@repo/ui/types/filterOperators.types';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BooleanFilterInput } from './BooleanFilterInput.component';

afterEach(cleanup);

const button = (name: string) => screen.getByRole('button', { name });

describe('BooleanFilterInput', () => {
  it('marks "All" active and clears the filter when no filter is set', () => {
    const onChange = vi.fn();

    render(<BooleanFilterInput filter={undefined} onChange={onChange} />);

    // "All" is the active choice: clicking it clears (emits no filter).
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

    // A truthy filter derives the "true" selection; picking "All" clears it.
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
});
