// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TrendChart } from './TrendChart.component';

const POINTS = [
  {
    href: '/evals/runs/a?trial=1',
    key: 'a',
    label: 'run a: 50%',
    lower: 0.3,
    upper: 0.7,
    value: 0.5,
  },
  { href: '/evals/runs/b?trial=7', key: 'b', label: 'run b: 75%', value: 0.75 },
];

const MARKS = [
  { index: 1, key: 'm', kind: 'model', label: 'Model changed' },
] as const;

afterEach(() => {
  cleanup();
});

describe('TrendChart', () => {
  it('links every point through to its run and its trial', () => {
    render(
      <MemoryRouter>
        <TrendChart label='Pass rate' marks={MARKS} points={POINTS} />
      </MemoryRouter>,
    );

    const chart = screen.getByRole('figure', { name: 'Pass rate' });

    expect(
      within(chart)
        .getAllByRole('link')
        .map((link) => [
          link.getAttribute('aria-label'),
          link.getAttribute('href'),
        ]),
    ).toEqual(POINTS.map(({ href, label }) => [label, href]));
  });

  it('draws the band and one line per mark, each titled', () => {
    const { container } = render(
      <MemoryRouter>
        <TrendChart label='Pass rate' marks={MARKS} points={POINTS} />
      </MemoryRouter>,
    );

    expect(container.querySelector('polygon')).not.toBeNull();
    expect(
      [...container.querySelectorAll(':scope line title')].map(
        (title) => title.textContent,
      ),
    ).toEqual(['Model changed']);
  });
});
