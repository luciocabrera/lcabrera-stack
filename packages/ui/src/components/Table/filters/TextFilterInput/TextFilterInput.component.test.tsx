// @vitest-environment jsdom

import type { TextFilter } from '@repo/ui/types/filterOperators.types';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TextFilterInput } from './TextFilterInput.component';

type Row = { readonly name: string };

afterEach(cleanup);

const getInput = () => screen.getByRole<HTMLInputElement>('textbox');

describe('TextFilterInput', () => {
  it('renders an empty text input when there is no filter', () => {
    render(
      <TextFilterInput<Row>
        columnKey='name'
        onChange={vi.fn()}
        operator='contains'
      />,
    );

    const input = getInput();
    expect(input.type).toBe('text');
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Enter text...');
  });

  it('seeds the input from the current filter value', () => {
    const filter: TextFilter = {
      operator: 'contains',
      type: 'text',
      value: 'acme',
    };

    render(
      <TextFilterInput<Row>
        columnKey='name'
        filter={filter}
        onChange={vi.fn()}
        operator='contains'
      />,
    );

    expect(getInput().value).toBe('acme');
  });

  it('emits a text filter carrying the controlled operator on every keystroke', () => {
    const onChange = vi.fn();

    render(
      <TextFilterInput<Row>
        columnKey='name'
        onChange={onChange}
        operator='startsWith'
      />,
    );

    fireEvent.change(getInput(), { target: { value: 'wid' } });

    expect(onChange).toHaveBeenCalledWith({
      operator: 'startsWith',
      type: 'text',
      value: 'wid',
    });
    expect(getInput().value).toBe('wid');
  });
});
