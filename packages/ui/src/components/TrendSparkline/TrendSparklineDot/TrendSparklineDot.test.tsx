// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TrendSparklineDot } from './TrendSparklineDot.component';

afterEach(cleanup);

describe('TrendSparklineDot', () => {
  it('draws a circle at its centre', () => {
    const { container } = render(
      <svg>
        <title>Chart</title>
        <TrendSparklineDot cx={10} cy={20} tone='neutral' value={3} />
      </svg>,
    );

    const circle = container.querySelector('circle');

    expect([circle?.getAttribute('cx'), circle?.getAttribute('cy')]).toEqual([
      '10',
      '20',
    ]);
    expect(circle?.getAttribute('r')).toBe('3');
    expect(container.querySelector('a')).toBeNull();
  });

  it('wraps the circle in a link when it has a target', () => {
    render(
      <MemoryRouter>
        <svg>
          <title>Chart</title>
          <TrendSparklineDot
            cx={10}
            cy={20}
            label='Week 3'
            to='/weeks/3'
            tone='success'
            value={3}
          />
        </svg>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Week 3' });

    expect(link.getAttribute('href')).toBe('/weeks/3');
    expect(link.getAttribute('class')).toBeTruthy();
  });
});
