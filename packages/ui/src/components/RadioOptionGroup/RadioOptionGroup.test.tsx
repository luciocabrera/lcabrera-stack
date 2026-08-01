// @vitest-environment jsdom

import { surfaceStyles } from '@lcabrera/ui/design-system/tokens/surfaces.stylex';
import * as stylex from '@stylexjs/stylex';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { RadioOptionGroup } from './RadioOptionGroup.component';
import { styles } from './RadioOptionGroup.stylex';

afterEach(cleanup);

const options = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { description: 'With description', label: 'Option C', value: 'c' },
] as const;

describe('RadioOptionGroup', () => {
  it('renders a radio for each option', () => {
    render(
      <RadioOptionGroup
        name='group'
        onChange={vi.fn()}
        options={[...options]}
        value='a'
      />,
    );

    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the matching option as checked', () => {
    render(
      <RadioOptionGroup
        name='group'
        onChange={vi.fn()}
        options={[...options]}
        value='b'
      />,
    );

    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: /Option B/i })
        .checked,
    ).toBe(true);
  });

  it('calls onChange with the selected value when a radio is clicked', () => {
    const handleChange = vi.fn();

    render(
      <RadioOptionGroup
        name='group'
        onChange={handleChange}
        options={[...options]}
        value='a'
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Option B/i }));

    expect(handleChange).toHaveBeenCalledWith('b');
  });

  it('applies the selected-accent styles only to the checked option card', () => {
    render(
      <RadioOptionGroup
        name='group'
        onChange={vi.fn()}
        options={[...options]}
        value='b'
      />,
    );

    const selectedClassName =
      stylex.props(styles.optionSelected).className ?? '';
    expect(selectedClassName.length).toBeGreaterThan(0);

    const selectedCard = screen
      .getByRole<HTMLInputElement>('radio', { name: /Option B/i })
      .closest('label') as HTMLLabelElement;
    const unselectedCard = screen
      .getByRole<HTMLInputElement>('radio', { name: /Option A/i })
      .closest('label') as HTMLLabelElement;

    const selectedHasAccent = selectedClassName
      .split(' ')
      .every((cls) => selectedCard.className.includes(cls));
    const unselectedHasAccent = selectedClassName
      .split(' ')
      .some((cls) => unselectedCard.className.includes(cls));

    expect(selectedHasAccent).toBe(true);
    expect(unselectedHasAccent).toBe(false);
  });

  it('applies the shared interactive-card surface to unselected option cards', () => {
    render(
      <RadioOptionGroup
        name='group'
        onChange={vi.fn()}
        options={[...options]}
        value='b'
      />,
    );

    // Guard the string, not the split array: `''.split(' ')` is `['']`, so a
    // length check after splitting would pass even if the recipe compiled to
    // nothing — and this assertion exists precisely to rule that out.
    const surfaceClassName =
      stylex.props(surfaceStyles.interactiveCard).className ?? '';
    expect(surfaceClassName.length).toBeGreaterThan(0);

    // Asserted on an UNSELECTED card on purpose: `optionSelected` legitimately
    // replaces the recipe's `borderColor` and `backgroundColor` keys — the
    // hover included — on the chosen one.
    const unselectedCard = screen
      .getByRole<HTMLInputElement>('radio', { name: /Option A/i })
      .closest('label') as HTMLLabelElement;
    const cardClasses = new Set(unselectedCard.className.split(' '));

    expect(
      surfaceClassName.split(' ').every((cls) => cardClasses.has(cls)),
    ).toBe(true);
  });

  it('renders description text when provided', () => {
    render(
      <RadioOptionGroup
        name='group'
        onChange={vi.fn()}
        options={[...options]}
        value='a'
      />,
    );

    expect(screen.getByText('With description').textContent).toBe(
      'With description',
    );
  });

  it('uses the label as the accessible radio name when a description is present', () => {
    render(
      <RadioOptionGroup
        name='group'
        onChange={vi.fn()}
        options={[...options]}
        value='a'
      />,
    );

    const radio = screen.getByRole<HTMLInputElement>('radio', {
      name: 'Option C',
    });
    const descriptionId = radio.getAttribute('aria-describedby');

    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId ?? '')?.textContent).toBe(
      'With description',
    );
  });
});
