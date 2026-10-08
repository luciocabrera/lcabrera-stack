// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
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

  it('names each point and the chart for assistive technology', () => {
    renderSparkline();

    expect(screen.getByRole('img', { name: 'Pass rate' })).toBeTruthy();
    expect(screen.getByLabelText('trial 9: fail')).toBeTruthy();
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
