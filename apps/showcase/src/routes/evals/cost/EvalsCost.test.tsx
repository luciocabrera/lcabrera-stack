// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';
import { handle } from './evals-cost.handle';
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
  label: 'Run r1: $0.50 reported by the SDK; open the costliest trial, 3',
  to: '/evals/runs/r1?trial=3',
  value: 0.5,
};

const DATA = {
  charts: [{ computed: [], p95: [], reported: [POINT], suite: 'skills' }],
  runs: [
    { cells: CELLS, href: '/evals/runs/r1', id: 'r1', label: 'skills run' },
  ],
  subjects: [
    {
      cells: CELLS,
      href: '/evals/subjects/skill/react-19',
      id: 'skill/react-19',
      label: 'skill react-19',
    },
  ],
  suites: [{ cells: CELLS, id: 'skills', label: 'skills' }],
};

const COLUMNS = [
  'Name',
  'Trials',
  'Tokens in',
  'Tokens out',
  'Cache tokens',
  EVALS_COST_LABELS.reported,
  EVALS_COST_LABELS.computed,
  'p50 duration',
  'p95 duration',
];

const Stub = createRoutesStub([
  {
    Component: EvalsCost,
    handle,
    loader: () => DATA,
    path: '/evals/cost',
  },
]);

const renderCost = async () => {
  render(<Stub initialEntries={['/evals/cost']} />);
  await screen.findByRole('heading', { level: 1, name: 'Cost and latency' });
};

const cellTexts = (table: HTMLElement) =>
  [...table.querySelectorAll(':scope tbody td')].map(
    ({ textContent }) => textContent,
  );

afterEach(() => {
  cleanup();
});

describe('EvalsCost', () => {
  it('heads the page and links back to the evals overview', async () => {
    await renderCost();

    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(
      within(trail).getByRole('link', { name: 'Evals' }).getAttribute('href'),
    ).toBe('/evals');
    expect(within(trail).getByText('cost and latency')).toBeDefined();
  });

  it('draws three captioned sparklines in a level-3 card per suite', async () => {
    await renderCost();

    expect(screen.getByRole('heading', { level: 3, name: 'skills' })).toBe(
      screen.getAllByRole('heading', { level: 3 })[0],
    );

    for (const caption of [
      'cost per run, reported by the sdk',
      'cost per run, computed from model prices',
      'p95 duration per run',
    ]) {
      expect(
        screen.getByRole('figure', { name: `skills: ${caption}` }),
      ).toBeDefined();
    }

    expect(
      within(
        screen.getByRole('figure', {
          name: 'skills: cost per run, reported by the sdk',
        }),
      )
        .getByRole('link', { name: POINT.label })
        .getAttribute('href'),
    ).toBe(POINT.to);
  });

  it('tabulates per suite, per subject and per run in the same nine columns', async () => {
    await renderCost();

    for (const name of ['Per suite', 'Per subject', 'Per run']) {
      const table = screen.getByRole('table', { name });

      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((cell) => cell.textContent),
      ).toEqual(COLUMNS);
    }

    expect(cellTexts(screen.getByRole('table', { name: 'Per suite' }))).toEqual(
      [
        'skills',
        '2',
        '10',
        '5',
        '0 read, 0 written',
        '$0.50',
        'no model price',
        '1s',
        '2s',
      ],
    );
  });

  it('links subject and run names, and leaves a suite name as text', async () => {
    await renderCost();

    expect(
      within(screen.getByRole('table', { name: 'Per subject' }))
        .getByRole('link', { name: 'skill react-19' })
        .getAttribute('href'),
    ).toBe('/evals/subjects/skill/react-19');
    expect(
      within(screen.getByRole('table', { name: 'Per run' }))
        .getByRole('link', { name: 'skills run' })
        .getAttribute('href'),
    ).toBe('/evals/runs/r1');
    expect(
      within(screen.getByRole('table', { name: 'Per suite' })).queryByRole(
        'link',
      ),
    ).toBeNull();
  });
});
