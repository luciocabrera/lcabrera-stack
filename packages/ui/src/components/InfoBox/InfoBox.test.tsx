// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import type { InfoBoxTone } from './InfoBox.types';

import { InfoBox } from './InfoBox.component';
import { styles } from './InfoBox.stylex';

const TONES: readonly InfoBoxTone[] = [
  'error',
  'info',
  'neutral',
  'success',
  'warning',
];

afterEach(cleanup);

describe('InfoBox', () => {
  it('renders children content', () => {
    render(
      <InfoBox>
        <p>Informational message</p>
      </InfoBox>,
    );

    expect(screen.getByText('Informational message').textContent).toBe(
      'Informational message',
    );
  });

  it('draws the neutral tone when none is given', () => {
    render(<InfoBox data-testid='box'>Message</InfoBox>);

    const box = screen.getByTestId('box');

    expect(hasStylexStyle({ element: box, style: styles.container })).toBe(
      true,
    );
    expect(hasStylexStyle({ element: box, style: styles.tone.neutral })).toBe(
      true,
    );
  });

  it.each(TONES)('draws the %s tone and no other', (tone) => {
    render(
      <InfoBox data-testid='box' tone={tone}>
        Message
      </InfoBox>,
    );

    const box = screen.getByTestId('box');

    expect(
      TONES.filter((candidate) =>
        hasStylexStyle({ element: box, style: styles.tone[candidate] }),
      ),
    ).toStrictEqual([tone]);
  });

  it('passes a role through, so an error can be announced', () => {
    render(
      <InfoBox role='alert' tone='error'>
        Something failed
      </InfoBox>,
    );

    expect(screen.getByRole('alert').textContent).toBe('Something failed');
  });

  it('carries no role unless it is given one', () => {
    render(<InfoBox data-testid='box'>Message</InfoBox>);

    expect(screen.getByTestId('box').getAttribute('role')).toBeNull();
  });

  it('passes other native attributes through', () => {
    render(
      <InfoBox aria-live='polite' id='notice' role='status'>
        Saved
      </InfoBox>,
    );

    const box = screen.getByRole('status');

    expect(box.id).toBe('notice');
    expect(box.getAttribute('aria-live')).toBe('polite');
  });
});
