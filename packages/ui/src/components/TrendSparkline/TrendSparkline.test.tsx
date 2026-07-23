// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TrendSparkline } from './TrendSparkline.component';

afterEach(cleanup);

describe('TrendSparkline', () => {
  it('renders no polyline when there are no values', () => {
    const { container } = render(<TrendSparkline label='Trend' values={[]} />);

    expect(container.querySelector('polyline')).toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('renders a polyline spanning the given width/height', () => {
    const { container } = render(
      <TrendSparkline
        height={20}
        label='Trend'
        values={[1, 5, 2]}
        width={80}
      />,
    );

    const svg = container.querySelector('svg');
    const polyline = container.querySelector('polyline');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 80 20');
    expect(polyline?.getAttribute('points')).toBe('0,20 40,0 80,15');
  });

  it('exposes the label as the accessible name of a populated chart', () => {
    const { container } = render(
      <TrendSparkline label='Errors per scan' values={[1, 5, 2]} />,
    );

    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.querySelector('title')?.textContent).toBe('Errors per scan');
  });
});
