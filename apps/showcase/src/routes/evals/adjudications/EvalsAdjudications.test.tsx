// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { expectHydratesWithoutMismatch } from '../utils/serverMarkup.fixtures';
import { tableCells, tableHeaders } from '../utils/staticTable.fixtures';
import { ACCURACY, CASES, VERDICTS } from './adjudications.fixtures';
import { adjudicationsView } from './adjudicationsView.util';
import { EvalsAdjudications } from './EvalsAdjudications.component';
import { EVALS_ADJUDICATIONS_HANDLE } from './EvalsAdjudications.constants';

const PATH = '/evals/adjudications';

const DATA = adjudicationsView({
  accuracy: ACCURACY,
  cases: CASES,
  verdicts: VERDICTS,
});

const EMPTY = adjudicationsView({ accuracy: [], cases: [], verdicts: [] });

const ROUTES = (data: unknown) => [
  {
    Component: EvalsAdjudications,
    handle: EVALS_ADJUDICATIONS_HANDLE,
    loader: () => data,
    path: PATH,
  },
];

const renderWith = async (data: unknown) => {
  const Stub = createRoutesStub(ROUTES(data));

  render(<Stub initialEntries={[PATH]} />);
  await screen.findByRole('heading', {
    level: 1,
    name: 'False-positive panel',
  });
};

const table = (name: string) => screen.getByRole('table', { name });

const texts = (cells: ReturnType<typeof tableCells>) =>
  cells.map((row) => row.map(({ text }) => text));

const rowTexts = (name: string) => texts(tableCells(table(name)));

afterEach(() => {
  cleanup();
});

describe('EvalsAdjudications', () => {
  it('says no case is stored yet, under a trail back to the overview', async () => {
    await renderWith(EMPTY);

    expect(
      screen.getByText('No false-positive panel case is stored yet.'),
    ).toBeDefined();
    expect(screen.queryAllByRole('table')).toEqual([]);
    expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
    expect(breadcrumbTrail()).toEqual(evalsTrail('adjudications'));
  });

  it('lists the history in facts, then a level-2 heading per section', async () => {
    await renderWith(DATA);

    expect(
      screen.getAllByRole('term').map(({ textContent }) => textContent),
    ).toEqual(DATA.facts.map(({ term }) => term));
    expect(
      screen.getAllByRole('definition').map(({ textContent }) => textContent),
    ).toEqual(['4', '3', '2', '1', '1', '1']);
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map(({ textContent }) => textContent),
    ).toEqual([
      'Cases',
      'Reopened dismissals',
      'Accuracy by model and role',
      'Accuracy by model and rule',
      'Accuracy by prompt',
      'False positives by rule',
      'Cost and time by model',
      'Cases by builder model',
    ]);
  });

  it('lists every case newest first, its outcome as a badge', async () => {
    await renderWith(DATA);

    const cases = table('False-positive panel cases, newest first');

    expect(tableHeaders(cases)).toEqual([
      'Case',
      'Opened',
      'Analyzer',
      'Rule',
      'PR',
      'Outcome',
      'Panel',
      'True answer',
      'Cost',
      'Slowest seat',
      'Builder model',
    ]);
    expect(texts(tableCells(cases)).map((row) => row[0])).toEqual([
      'FP-0004',
      'FP-0003',
      'FP-0002',
      'FP-0001',
    ]);
    expect(texts(tableCells(cases))[2]).toEqual([
      'FP-0002',
      '2026-11-02',
      'fallow',
      'complexity',
      '',
      'split',
      '2 FALSE_POSITIVE, 1 REAL',
      'REAL (lucio)',
      '$0.20',
      '1m 30s',
      'not recorded',
    ]);
    expect(
      within(cases).getByText('split').closest('td')?.children,
    ).toHaveLength(1);
    expect(screen.getByText(/^All 4 cases, newest first\./u)).toBeDefined();
  });

  it('says how many cases it shows when the history is longer', async () => {
    await renderWith({
      ...DATA,
      cases: { ...DATA.cases, total: 250 },
    });

    expect(screen.getByText(/^The newest 4 of 250 cases\./u)).toBeDefined();
  });

  it('lists each reopened dismissal, or says there is none', async () => {
    await renderWith(DATA);

    expect(
      screen
        .getAllByRole('listitem')
        .map(({ textContent }) => textContent)
        .filter((text) => text.startsWith('FP-')),
    ).toEqual([DATA.reopened[0]?.label]);

    cleanup();
    await renderWith({ ...DATA, reopened: [] });

    expect(screen.getByText('No dismissal has been reopened.')).toBeDefined();
  });

  it('scores each model and role, and draws its accuracy over time', async () => {
    await renderWith(DATA);

    const accuracy = table(
      'Verdicts scored against the latest true answer, by model and role',
    );

    expect(tableHeaders(accuracy)).toEqual([
      'Model',
      'Role',
      'Verdicts',
      'Correct',
      'Accuracy',
      'Interval',
      'Missed a real finding',
      'Called a false positive real',
    ]);
    expect(texts(tableCells(accuracy))[0]).toEqual([
      'claude-fable-5-1',
      'adversary',
      '3',
      '2',
      '67% (2/3)',
      'too few verdicts for an interval',
      '1',
      '0',
    ]);

    const chart = screen.getByRole('figure', {
      name: 'Accuracy of each model over the cases it sat on, in the order they opened',
    });

    expect(
      within(chart).getByText('claude-opus-5-5 after FP-0002: 50% (1/2)'),
    ).toBeDefined();
  });

  it('says no verdict can be scored before any true answer', async () => {
    await renderWith({ ...DATA, accuracy: [], trend: [] });

    expect(
      screen.getByText(
        'No case has a true answer yet, so no verdict can be scored.',
      ),
    ).toBeDefined();
    expect(screen.queryAllByRole('figure')).toHaveLength(1);
  });

  it('draws the model by rule heatmap, and leaves it out with no scored cell', async () => {
    await renderWith(DATA);

    const heatmap = screen.getByRole('figure', {
      name: 'Accuracy of 3 models over 2 rules',
    });

    expect(
      within(heatmap).getAllByText(
        'claude-opus-5-5 on fallow: complexity: 0% (0/1)',
      ).length,
    ).toBeGreaterThan(0);
    expect(within(heatmap).getByText('90% or more correct')).toBeDefined();

    cleanup();
    await renderWith({
      ...DATA,
      heatmap: { ...DATA.heatmap, cells: [] },
    });

    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: 'Accuracy by model and rule',
      }),
    ).toBeNull();
  });

  it('lists accuracy per prompt hash, false positives per rule, cost per model and cases per builder', async () => {
    await renderWith(DATA);

    expect(
      rowTexts('Verdicts by role and prompt hash, oldest prompt first'),
    ).toEqual([
      ['adversary', 'b'.repeat(12), '2026-11-01', '3', '100% (2/2)'],
      ['adversary', 'c'.repeat(12), '2026-11-03', '1', '0% (0/1)'],
      ['judge', 'a'.repeat(12), '2026-11-01', '8', '33% (2/6)'],
    ]);
    expect(
      tableHeaders(
        table(
          'Cases by analyzer and rule, with the share the true answer called a false positive',
        ),
      ),
    ).toEqual([
      'Analyzer',
      'Rule',
      'Cases',
      'Dismissed',
      'With a true answer',
      'False positives',
      'False-positive rate',
      'Reopened',
    ]);
    expect(
      rowTexts('Reported cost, time and tokens of each model on the panel')[0],
    ).toEqual([
      'claude-fable-5-1',
      '4',
      '4',
      '$3.00',
      '$1.00',
      '1m 30s',
      '4,000',
      '8,000',
    ]);
    expect(
      rowTexts(
        'Cases by the model that built the change, with the panel accuracy on them',
      ),
    ).toEqual([
      ['claude-opus-5-5', '3', '2', '50% (3/6)'],
      ['not recorded', '1', '0', '33% (1/3)'],
    ]);
  });

  it('hydrates the server markup without a mismatch', async () => {
    const container = await expectHydratesWithoutMismatch({
      path: PATH,
      routes: ROUTES(DATA),
    });

    expect(container.querySelectorAll('figure')).toHaveLength(2);
  });
});
