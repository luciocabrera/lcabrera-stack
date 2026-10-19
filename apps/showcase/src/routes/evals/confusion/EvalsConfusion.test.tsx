// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsConfusion } from './EvalsConfusion.component';
import { CORNER } from './EvalsConfusion.constants';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    { Component: EvalsConfusion, loader: () => data, path: '/evals/confusion' },
  ]);

  return render(<Stub initialEntries={['/evals/confusion']} />);
};

const RUN = { label: '2026-10-01 02:00 on main', runId: 'r1' };

afterEach(() => {
  cleanup();
});

describe('EvalsConfusion', () => {
  it('draws the matrix with the expectation down the side', async () => {
    renderWith({
      choices: [RUN],
      matrix: {
        columns: ['react-19', '(none)'],
        rows: [
          {
            cells: [
              { column: 'react-19', count: 2, isMisload: false, label: '2' },
              { column: '(none)', count: 1, isMisload: true, label: '1' },
            ],
            expected: 'react-19',
            trials: 3,
          },
        ],
      },
      runs: [RUN],
      selectedRunId: undefined,
    });

    const table = await screen.findByRole('table', {
      name: 'Skills loaded per expectation over the last 1 skills runs',
    });

    expect(
      [...table.querySelectorAll(':scope th')].map(
        ({ textContent }) => textContent,
      ),
    ).toEqual([CORNER, 'react-19', '(none)', 'Trials']);
    expect(
      [...table.querySelectorAll(':scope tbody td')].map(
        ({ textContent }) => textContent,
      ),
    ).toEqual(['react-19', '2', '1', '3']);
    expect(
      screen.getByRole('link', { name: RUN.label }).getAttribute('href'),
    ).toBe('/evals/confusion?run=r1');
  });

  it('says when the selection holds no trigger trial', async () => {
    renderWith({
      choices: [RUN],
      matrix: { columns: [], rows: [] },
      runs: [RUN],
      selectedRunId: 'r1',
    });

    expect(
      await screen.findByText(
        `No trigger or near-miss trial is stored for the run of ${RUN.label}.`,
      ),
    ).toBeDefined();
    expect(screen.getByRole('link', { name: 'Recent runs' })).toBeDefined();
  });
});
