// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TrendPoint } from './TrendSparkline.types';

import { TrendSparkline } from './TrendSparkline.component';

afterEach(cleanup);

const POINTS: readonly TrendPoint[] = [
  { label: 'Week 1: passed', to: '/weeks/1', tone: 'success', value: 1 },
  { label: 'Week 2: failed', tone: 'error', value: 0.25 },
  { value: 0.5 },
];

describe('TrendSparkline', () => {
  describe('values mode', () => {
    it('renders no line when there are no values', () => {
      const { container } = render(
        <TrendSparkline label='Trend' values={[]} />,
      );

      expect(container.querySelector('path')).toBeNull();
      expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
      expect(container.querySelector('svg')?.getAttribute('role')).toBeNull();
    });

    it('renders a line spanning the given width and height', () => {
      const { container } = render(
        <TrendSparkline
          height={20}
          label='Trend'
          values={[1, 5, 2]}
          width={80}
        />,
      );

      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe(
        '0 0 80 20',
      );
      expect(container.querySelector('path')?.getAttribute('d')).toBe(
        'M0,20L40,0L80,15',
      );
      expect(container.querySelector('circle')).toBeNull();
    });

    it('exposes the label as the accessible name of a populated chart', () => {
      render(<TrendSparkline label='Errors per scan' values={[1, 5, 2]} />);

      expect(screen.getByRole('img', { name: 'Errors per scan' })).toBeTruthy();
    });

    it('colours the line from its tone', () => {
      const { container } = render(
        <TrendSparkline label='Trend' values={[1, 2]} />,
      );
      const { container: toned } = render(
        <TrendSparkline label='Trend' tone='error' values={[1, 2]} />,
      );

      expect(toned.querySelector('path')?.getAttribute('class')).not.toBe(
        container.querySelector('path')?.getAttribute('class'),
      );
    });
  });

  describe('points mode', () => {
    it('draws one dot per point, joined by a line', () => {
      const { container } = render(
        <MemoryRouter>
          <TrendSparkline
            height={48}
            label='Weekly results'
            max={1}
            points={POINTS}
            width={108}
          />
        </MemoryRouter>,
      );

      const dots = [...container.querySelectorAll('circle')];

      expect(
        dots.map((dot) => [dot.getAttribute('cx'), dot.getAttribute('cy')]),
      ).toEqual([
        ['4', '4'],
        ['54', '34'],
        ['104', '24'],
      ]);
      expect(container.querySelector('path')?.getAttribute('d')).toBe(
        'M4,4L54,34L104,24',
      );
    });

    it('colours each dot from its own tone, and from the chart tone without one', () => {
      const { container } = render(
        <MemoryRouter>
          <TrendSparkline
            label='Weekly results'
            points={[
              { tone: 'success', value: 1 },
              { tone: 'error', value: 1 },
              { value: 1 },
              { tone: 'error', value: 1 },
            ]}
            tone='error'
          />
        </MemoryRouter>,
      );

      const classes = [...container.querySelectorAll('circle')].map((dot) =>
        dot.getAttribute('class'),
      );

      expect(classes[0]).not.toBe(classes[1]);
      expect(classes[1]).toBe(classes[2]);
      expect(classes[2]).toBe(classes[3]);
    });

    it('draws no line when the points are not connected', () => {
      const { container } = render(
        <TrendSparkline
          isConnected={false}
          label='Weekly results'
          points={[{ value: 1 }, { value: 2 }]}
        />,
      );

      expect(container.querySelector('path')).toBeNull();
      expect(container.querySelectorAll('circle')).toHaveLength(2);
    });

    it('is an image when no dot is linked', () => {
      render(
        <TrendSparkline
          label='Weekly results'
          points={[{ value: 1 }, { value: 2 }]}
        />,
      );

      expect(screen.getByRole('img', { name: 'Weekly results' })).toBeTruthy();
      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('renders a linked dot as a link named by its label', () => {
      render(
        <MemoryRouter>
          <TrendSparkline label='Weekly results' points={POINTS} />
        </MemoryRouter>,
      );

      const link = screen.getByRole('link', { name: 'Week 1: passed' });

      expect(link.getAttribute('href')).toBe('/weeks/1');
      expect(screen.getAllByRole('link')).toHaveLength(1);
      expect(
        screen.getByRole('group', { name: 'Weekly results' }),
      ).toBeTruthy();
    });

    it('names a linked dot by its value when it has no label', () => {
      render(
        <MemoryRouter>
          <TrendSparkline
            label='Weekly results'
            points={[{ to: '/x', value: 0.75 }]}
          />
        </MemoryRouter>,
      );

      expect(screen.getByRole('link', { name: '0.75' })).toBeTruthy();
    });

    it('titles each dot with its label', () => {
      const { container } = render(
        <TrendSparkline
          label='Weekly results'
          points={[{ label: 'Week 2: failed', value: 1 }, { value: 2 }]}
        />,
      );

      expect(
        [...container.querySelectorAll('circle')].map(
          (dot) => dot.querySelector('title')?.textContent,
        ),
      ).toEqual(['Week 2: failed', '2']);
    });
  });

  describe('server render', () => {
    it.each([
      {
        chart: <TrendSparkline label='Trend' values={[1, 5, 2]} />,
        mode: 'values',
      },
      {
        chart: (
          <TrendSparkline label='Weekly results' max={1} points={POINTS} />
        ),
        mode: 'points',
      },
      { chart: <TrendSparkline label='Trend' values={[]} />, mode: 'empty' },
    ])(
      'renders the same $mode markup on the server and the client',
      ({ chart }) => {
        const tree = <MemoryRouter>{chart}</MemoryRouter>;
        const { container } = render(tree);

        expect(renderToString(tree)).toBe(
          container.firstElementChild?.outerHTML,
        );
      },
    );
  });
});
