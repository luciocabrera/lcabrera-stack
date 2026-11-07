// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  formInputSizeVariants,
  formInputStyles,
} from '#ui/components/Form/fields/formInput.stylex';
import { expectFieldLabel } from '#ui/utils/tests/expectFieldLabel.util';
import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import { TextInput } from './TextInput.component';

const overrideStyles = stylex.create({
  tall: { height: '3rem' },
});

afterEach(cleanup);

describe('TextInput', () => {
  it('renders a bare native input with no wrapper when there is no label', () => {
    const { container } = render(<TextInput aria-label='Search' />);

    expect(container.firstElementChild?.tagName).toBe('INPUT');
    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBe(
      container.firstElementChild,
    );
  });

  it('names the input with a visible label above it', () => {
    render(<TextInput label='Search' />);

    expect(expectFieldLabel('Search').tagName).toBe('INPUT');
  });

  it('keeps an id it is given, and labels through it', () => {
    render(<TextInput id='search-box' label='Search' />);

    expect(screen.getByLabelText('Search').id).toBe('search-box');
    expect(screen.getByText('Search').getAttribute('for')).toBe('search-box');
  });

  it('is uncontrolled: it starts from defaultValue and keeps what the reader types', () => {
    render(<TextInput aria-label='Search' defaultValue='main' name='q' />);

    const input = screen.getByRole<HTMLInputElement>('textbox');

    expect(input.value).toBe('main');
    expect(input.name).toBe('q');

    fireEvent.change(input, { target: { value: 'release' } });

    expect(input.value).toBe('release');
  });

  it('passes native attributes and change events through', () => {
    const handleChange = vi.fn();

    render(
      <TextInput
        aria-label='Email'
        disabled
        onChange={handleChange}
        placeholder='name@example.com'
        required
        type='email'
      />,
    );

    const input = screen.getByRole<HTMLInputElement>('textbox');

    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.type).toBe('email');
    expect(input.placeholder).toBe('name@example.com');

    fireEvent.change(input, { target: { value: 'a@b.c' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('hands its ref the native input', () => {
    const ref = createRef<HTMLInputElement>();

    render(<TextInput aria-label='Search' ref={ref} />);

    expect(ref.current).toBe(screen.getByRole('textbox'));
  });

  it('draws the shared input styles and no size by default', () => {
    render(<TextInput aria-label='Search' />);

    expect(screen.getByRole('textbox').className).toBe(
      stylex.props(formInputStyles.input).className,
    );
  });

  it.each(
    Object.keys(
      formInputSizeVariants,
    ) as (keyof typeof formInputSizeVariants)[],
  )('applies the %s size', (size) => {
    render(<TextInput aria-label='Search' size={size} />);

    expect(
      hasStylexStyle({
        element: screen.getByRole('textbox'),
        style: formInputSizeVariants[size],
      }),
    ).toBe(true);
  });

  it('applies customStylex last, over the size it is given', () => {
    render(
      <TextInput
        aria-label='Search'
        customStylex={overrideStyles.tall}
        size='sm'
      />,
    );

    const input = screen.getByRole('textbox');

    expect(hasStylexStyle({ element: input, style: overrideStyles.tall })).toBe(
      true,
    );
    expect(
      hasStylexStyle({ element: input, style: formInputSizeVariants.sm }),
    ).toBe(false);
  });

  it('renders the same markup on the server and the client', () => {
    expectServerMarkupMatchesClient(
      <TextInput defaultValue='main' id='q' label='Search' name='q' />,
    );
  });
});
