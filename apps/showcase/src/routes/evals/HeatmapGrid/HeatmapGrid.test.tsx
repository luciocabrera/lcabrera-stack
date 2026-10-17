// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { HeatmapGrid } from './HeatmapGrid.component';

const GRID = {
  runs: [
    { href: '/evals/runs/r1', label: 'Run r1', runId: 'r1' },
    { href: '/evals/runs/r2', label: 'Run r2', runId: 'r2' },
  ],
  subjects: [
    {
      cells: [
        {
          href: '/evals/runs/r1?trial=3',
          isFlaky: true,
          key: 'react-19/r1',
          label: 'react-19 r1: 2/3, flaky',
          tone: 'mid' as const,
        },
        undefined,
      ],
      href: '/evals/subjects/skill/react-19',
      key: 'skill/react-19',
      label: 'react-19',
    },
  ],
  suite: 'skills' as const,
};

afterEach(() => {
  cleanup();
});

describe('HeatmapGrid', () => {
  it('links every cell through to its run and its trial, and every subject to its trend', () => {
    render(
      <MemoryRouter>
        <HeatmapGrid grid={GRID} />
      </MemoryRouter>,
    );

    const chart = screen.getByRole('figure', {
      name: 'skills: 1 subjects over 2 runs',
    });
    const hrefs = within(chart)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));

    expect(hrefs).toEqual([
      '/evals/runs/r1',
      '/evals/runs/r2',
      '/evals/subjects/skill/react-19',
      '/evals/runs/r1?trial=3',
    ]);
  });

  it('hatches a flaky cell with the pattern it defines', () => {
    const { container } = render(
      <MemoryRouter>
        <HeatmapGrid grid={GRID} />
      </MemoryRouter>,
    );
    const pattern = container.querySelector('pattern');
    const hatched = container.querySelectorAll('[data-flaky="true"]');

    expect(hatched).toHaveLength(1);
    expect(hatched[0]?.getAttribute('fill')).toBe(
      `url(#${pattern?.id ?? 'missing'})`,
    );
  });
});
