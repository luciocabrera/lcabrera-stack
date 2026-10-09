// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Sparkline } from './Sparkline.component';

const POINTS = [
  { href: '/evals/runs/a', key: 'a', label: 'run a: 50%', value: 0.5 },
  { href: '/evals/runs/b', key: 'b', label: 'run b: 75%', value: 0.75 },
  {
    href: '/evals/runs/c?trial=9',
    key: 'c',
    label: 'trial 9: fail',
    tone: 'error' as const,
    value: 0.25,
  },
];

const PRESENTATIONAL_PARENT =
  '[role="img"], [role="presentation"], [role="none"]';

const renderSparkline = (isConnected?: boolean) =>
  render(
    <MemoryRouter>
      <Sparkline
        label='Pass rate'
        maxValue={1}
        points={POINTS}
        {...(isConnected !== undefined && { isConnected })}
      />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

describe('Sparkline', () => {
  it('links every point through to its own page', () => {
    const { container } = renderSparkline();
    const links = [...container.querySelectorAll(':scope svg a')];

    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      POINTS.map(({ href }) => href),
    );
    expect(container.querySelectorAll('circle')).toHaveLength(POINTS.length);
  });

  it('exposes every point as a named link inside a named chart', () => {
    renderSparkline();

    const chart = screen.getByRole('figure', { name: 'Pass rate' });
    const links = within(chart).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(
      POINTS.map(({ label }) => label),
    );
    expect(
      links.filter((link) => link.closest(PRESENTATIONAL_PARENT) !== null),
    ).toEqual([]);
    expect(
      within(chart)
        .getByRole('link', { name: 'trial 9: fail' })
        .getAttribute('href'),
    ).toBe('/evals/runs/c?trial=9');
  });

  it('draws the line only when the points are a series', () => {
    expect(
      renderSparkline().container.querySelector('polyline'),
    ).not.toBeNull();
    cleanup();
    expect(
      renderSparkline(false).container.querySelector('polyline'),
    ).toBeNull();
  });
});
