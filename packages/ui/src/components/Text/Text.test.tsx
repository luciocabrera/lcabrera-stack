// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import type { TextElement, TextSize, TextTone, TextWeight } from './Text.types';

import { Text } from './Text.component';
import { styles } from './Text.stylex';

afterEach(cleanup);

const ELEMENTS: readonly TextElement[] = [
  'dd',
  'div',
  'dt',
  'figcaption',
  'label',
  'p',
  'span',
];
const SIZES: readonly TextSize[] = ['xs', 'sm', 'md', 'lg'];
const TONES: readonly TextTone[] = [
  'primary',
  'secondary',
  'tertiary',
  'error',
  'info',
  'success',
  'warning',
];
const WEIGHTS: readonly TextWeight[] = ['normal', 'medium', 'semibold', 'bold'];

describe('Text', () => {
  it('renders a paragraph at the md size in the primary tone by default', () => {
    render(<Text>Body copy</Text>);

    const element = screen.getByText('Body copy');

    expect(element.tagName).toBe('P');
    expect(hasStylexStyle({ element, style: styles.text })).toBe(true);
    expect(hasStylexStyle({ element, style: styles.size.md })).toBe(true);
    expect(hasStylexStyle({ element, style: styles.tone.primary })).toBe(true);
    expect(
      WEIGHTS.some((weight) =>
        hasStylexStyle({ element, style: styles.weight[weight] }),
      ),
    ).toBe(false);
    expect(hasStylexStyle({ element, style: styles.mono })).toBe(false);
    expect(hasStylexStyle({ element, style: styles.tabular })).toBe(false);
  });

  it.each(ELEMENTS)('renders the requested %s element', (as) => {
    render(<Text as={as}>Element</Text>);

    expect(screen.getByText('Element').tagName).toBe(as.toUpperCase());
  });

  it.each(SIZES)('maps the %s size to its own font-size token', (size) => {
    render(<Text size={size}>Sized</Text>);

    const element = screen.getByText('Sized');

    expect(hasStylexStyle({ element, style: styles.size[size] })).toBe(true);
    expect(
      SIZES.filter((other) => other !== size).some((other) =>
        hasStylexStyle({ element, style: styles.size[other] }),
      ),
    ).toBe(false);
  });

  it.each(TONES)('maps the %s tone to its own colour token', (tone) => {
    render(<Text tone={tone}>Toned</Text>);

    const element = screen.getByText('Toned');

    expect(hasStylexStyle({ element, style: styles.tone[tone] })).toBe(true);
    expect(
      TONES.filter((other) => other !== tone).some((other) =>
        hasStylexStyle({ element, style: styles.tone[other] }),
      ),
    ).toBe(false);
  });

  it.each(WEIGHTS)('applies the %s weight', (weight) => {
    render(<Text weight={weight}>Weighted</Text>);

    const element = screen.getByText('Weighted');

    expect(hasStylexStyle({ element, style: styles.weight[weight] })).toBe(
      true,
    );
  });

  it('applies the monospace family and tabular figures when asked', () => {
    render(
      <Text isMono isTabular>
        1,234.50
      </Text>,
    );

    const element = screen.getByText('1,234.50');

    expect(hasStylexStyle({ element, style: styles.mono })).toBe(true);
    expect(hasStylexStyle({ element, style: styles.tabular })).toBe(true);
  });

  it('applies a customStylex override after its own size', () => {
    render(<Text customStylex={styles.size.xs}>Override</Text>);

    const element = screen.getByText('Override');

    expect(hasStylexStyle({ element, style: styles.size.xs })).toBe(true);
    expect(hasStylexStyle({ element, style: styles.size.md })).toBe(false);
  });

  it('associates a label with its control through htmlFor', () => {
    render(
      <>
        <Text as='label' htmlFor='quantity'>
          Quantity
        </Text>
        <input id='quantity' />
      </>,
    );

    const label = screen.getByText('Quantity');

    expect(label.getAttribute('for')).toBe('quantity');
    expect(screen.getByLabelText('Quantity').id).toBe('quantity');
  });

  it('passes an id to a description', () => {
    render(
      <dl>
        <Text as='dt'>Term</Text>
        <Text as='dd' id='term-description'>
          Description
        </Text>
      </dl>,
    );

    expect(screen.getByText('Description').id).toBe('term-description');
  });

  it('passes aria attributes through', () => {
    render(<Text aria-hidden>Decorative</Text>);

    expect(screen.getByText('Decorative').getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('keeps its own classes over a className attribute', () => {
    render(<Text className='caller-class'>Classed</Text>);

    const element = screen.getByText('Classed');

    expect(element.classList.contains('caller-class')).toBe(false);
    expect(hasStylexStyle({ element, style: styles.text })).toBe(true);
  });

  it('renders the same markup on the server as on the client', () => {
    expectServerMarkupMatchesClient(
      <Text as='span' isMono isTabular size='sm' tone='error' weight='bold'>
        Server
      </Text>,
    );
  });
});
