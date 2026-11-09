// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { formInputStyles } from '#ui/components/Form/fields/formInput.stylex';
import { controlSizeVariants } from '#ui/design-system/tokens/commons.stylex';
import { expectFieldLabel } from '#ui/utils/tests/expectFieldLabel.util';
import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import { Select } from './Select.component';

const overrideStyles = stylex.create({
  tall: { height: '3rem' },
});

const OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
] as const;

afterEach(cleanup);

describe('Select', () => {
  it('renders one native option per entry, in order', () => {
    render(<Select aria-label='State' options={OPTIONS} />);

    const select = screen.getByRole('combobox', { name: 'State' });

    expect(select.tagName).toBe('SELECT');
    expect(
      [...screen.getAllByRole('option')].map((option) => [
        option.getAttribute('value'),
        option.textContent,
      ]),
    ).toStrictEqual([
      ['open', 'Open'],
      ['closed', 'Closed'],
    ]);
  });

  it('names the select with a visible label above it', () => {
    render(<Select label='State' options={OPTIONS} />);

    expect(expectFieldLabel('State').tagName).toBe('SELECT');
  });

  it('keeps an id it is given, and labels through it', () => {
    render(<Select id='state-filter' label='State' options={OPTIONS} />);

    expect(screen.getByLabelText('State').id).toBe('state-filter');
    expect(screen.getByText('State').getAttribute('for')).toBe('state-filter');
  });

  it('renders the bare select with no wrapper when there is no label', () => {
    const { container } = render(
      <Select aria-label='State' options={OPTIONS} />,
    );

    expect(container.firstElementChild?.tagName).toBe('SELECT');
    expect(container.querySelector('label')).toBeNull();
  });

  it('is uncontrolled: it starts from defaultValue and keeps what the reader picks', () => {
    render(
      <Select
        aria-label='State'
        defaultValue='closed'
        name='state'
        options={OPTIONS}
      />,
    );

    const select = screen.getByRole<HTMLSelectElement>('combobox');

    expect(select.value).toBe('closed');
    expect(select.name).toBe('state');

    fireEvent.change(select, { target: { value: 'open' } });

    expect(select.value).toBe('open');
  });

  it('passes native attributes and change events through', () => {
    const handleChange = vi.fn();

    render(
      <Select
        aria-label='State'
        disabled
        onChange={handleChange}
        options={OPTIONS}
        required
      />,
    );

    const select = screen.getByRole<HTMLSelectElement>('combobox');

    expect(select.disabled).toBe(true);
    expect(select.required).toBe(true);

    fireEvent.change(select, { target: { value: 'closed' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('hands its ref the native select', () => {
    const ref = createRef<HTMLSelectElement>();

    render(<Select aria-label='State' options={OPTIONS} ref={ref} />);

    expect(ref.current).toBe(screen.getByRole('combobox'));
  });

  it('draws the shared input styles with the native arrow, and no size by default', () => {
    render(<Select aria-label='State' options={OPTIONS} />);

    expect(screen.getByRole('combobox').className).toBe(
      stylex.props(formInputStyles.input, formInputStyles.select).className,
    );
  });

  it.each(
    Object.keys(controlSizeVariants) as (keyof typeof controlSizeVariants)[],
  )('applies the %s size', (size) => {
    render(<Select aria-label='State' options={OPTIONS} size={size} />);

    expect(
      hasStylexStyle({
        element: screen.getByRole('combobox'),
        style: controlSizeVariants[size],
      }),
    ).toBe(true);
  });

  it('applies customStylex last, over the size it is given', () => {
    render(
      <Select
        aria-label='State'
        customStylex={overrideStyles.tall}
        options={OPTIONS}
        size='sm'
      />,
    );

    const select = screen.getByRole('combobox');

    expect(
      hasStylexStyle({ element: select, style: overrideStyles.tall }),
    ).toBe(true);
    expect(
      hasStylexStyle({ element: select, style: controlSizeVariants.sm }),
    ).toBe(false);
  });

  it('renders the same markup on the server and the client', () => {
    expectServerMarkupMatchesClient(
      <Select
        defaultValue='closed'
        id='state'
        label='State'
        name='state'
        options={OPTIONS}
      />,
    );
  });
});
