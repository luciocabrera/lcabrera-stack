// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsSubjectTrend } from './EvalsSubjectTrend.component';

const POINT = {
  contentHashes: ['b'.repeat(64)],
  href: '/evals/runs/r2?trial=8',
  key: 'r2',
  label: 'skills run r2: 50% (1/2); open trial 8',
  modelId: 'model-a',
  startedAt: '2026-10-02T02:00:00.000Z',
  value: 0.5,
};

afterEach(() => {
  cleanup();
});

describe('EvalsSubjectTrend', () => {
  it('charts each suite apart and lists each mark with a link to its run', async () => {
    const Stub = createRoutesStub([
      {
        Component: EvalsSubjectTrend,
        loader: () => ({
          kind: 'skill',
          name: 'react-19',
          series: [
            {
              marks: [
                {
                  index: 0,
                  key: 'content-r2',
                  kind: 'content',
                  label: 'Content hash changed to bbbbbbbbbbbb',
                },
              ],
              points: [POINT],
              runs: 1,
              suite: 'skills',
            },
            { marks: [], points: [], runs: 2, suite: 'skill-quality' },
          ],
        }),
        path: '/evals/subjects/:kind/:name',
      },
    ]);

    render(<Stub initialEntries={['/evals/subjects/skill/react-19']} />);

    expect(
      await screen.findByRole('figure', {
        name: 'skill react-19 pass rate in skills over time',
      }),
    ).toBeDefined();
    expect(
      screen
        .getAllByRole('link', { name: POINT.label })
        .map((link) => link.getAttribute('href')),
    ).toEqual([POINT.href, POINT.href]);
    expect(
      screen.getByRole('figure', {
        name: 'skill react-19 pass rate in skill-quality over time',
      }),
    ).toBeDefined();
    expect(screen.getByRole('listitem').textContent).toContain(
      'Content hash changed to bbbbbbbbbbbb',
    );
  });
});
