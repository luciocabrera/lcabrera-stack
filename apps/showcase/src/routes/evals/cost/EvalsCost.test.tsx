// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';
import { EvalsCost } from './EvalsCost.component';

const CELLS = {
  computed: 'no model price',
  p50: '1s',
  p95: '2s',
  reported: '$0.50',
  tokensCache: '0 read, 0 written',
  tokensIn: '10',
  tokensOut: '5',
  trials: '2',
};

const POINT = {
  href: '/evals/runs/r1?trial=3',
  key: 'r1',
  label: 'Run r1: $0.50 reported by the SDK; open the costliest trial, 3',
  value: 0.5,
};

const DATA = {
  charts: [{ computed: [], p95: [], reported: [POINT], suite: 'skills' }],
  runs: [
    { cells: CELLS, href: '/evals/runs/r1', id: 'r1', label: 'skills run' },
  ],
  subjects: [],
  suites: [{ cells: CELLS, id: 'skills', label: 'skills' }],
};

afterEach(() => {
  cleanup();
});

describe('EvalsCost', () => {
  it('heads the reported and the computed cost as separate columns', async () => {
    const Stub = createRoutesStub([
      { Component: EvalsCost, loader: () => DATA, path: '/evals/cost' },
    ]);

    render(<Stub initialEntries={['/evals/cost']} />);

    const suites = await screen.findByRole('table', { name: 'Per suite' });
    const headers = within(suites)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);

    expect(headers).toContain(EVALS_COST_LABELS.reported);
    expect(headers).toContain(EVALS_COST_LABELS.computed);
    expect(within(suites).getByText('no model price')).toBeDefined();
    expect(
      screen.getByRole('link', { name: POINT.label }).getAttribute('href'),
    ).toBe(POINT.href);
  });
});
