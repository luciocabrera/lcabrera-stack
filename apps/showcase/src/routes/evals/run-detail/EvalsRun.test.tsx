// @vitest-environment jsdom

import type {
  RunSummary,
  RunTrial,
} from '@repo/eval-history/queries/queries.types';
import type { LoaderFunctionArgs } from 'react-router';

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import {
  selectRunSummaries,
  selectRunTrials,
} from '../.server/evalsHistory.service';
import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { expectHydratesWithoutMismatch } from '../utils/serverMarkup.fixtures';
import { trialSummaryLabel } from '../utils/trialSummaryLabel.util';
import { loader } from './evals-run.loader';
import { EvalsRun } from './EvalsRun.component';
import { EVALS_RUN_HANDLE } from './EvalsRun.constants';

vi.mock('../.server/evalsHistory.service', () => ({
  selectRunSummaries: vi.fn(),
  selectRunTrials: vi.fn(),
}));

const RUN_ID = '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50';
const RUN_PATH = `/evals/runs/${RUN_ID}`;

const RUN = {
  branch: 'main',
  finishedAt: new Date('2026-10-01T02:40:00.000Z'),
  gitSha: 'a'.repeat(40),
  harnessVersion: 'abcdefabcdef',
  k: 1,
  n: 2,
  runId: RUN_ID,
  startedAt: new Date('2026-10-01T02:00:00.000Z'),
  status: 'complete',
  suite: 'skills',
  trials: 2,
  trigger: 'ci-scheduled',
} as RunSummary;

const trial = (overrides: Partial<RunTrial>) =>
  ({
    durationMs: 12_000,
    outcome: 'pass',
    taskKey: 'skills/react-19/trigger-1',
    trialId: '7',
    trialIndex: 0,
    ...overrides,
  }) as RunTrial;

const RUN_TRIAL = trial({ outcome: 'fail', trialId: '8' });

const TRIALS = [trial({}), RUN_TRIAL];

const ROUTE = {
  Component: EvalsRun,
  handle: EVALS_RUN_HANDLE,
  loader: (args: LoaderFunctionArgs) => loader(args),
  path: '/evals/runs/:runId',
};

const renderAt = async (path: string) => {
  const Stub = createRoutesStub([ROUTE]);

  render(<Stub initialEntries={[path]} />);
  await screen.findByRole('heading', { level: 1, name: 'skills on main' });
};

beforeEach(() => {
  vi.stubEnv('EVALS_DASHBOARD', '1');
  vi.mocked(selectRunSummaries).mockResolvedValue([RUN]);
  vi.mocked(selectRunTrials).mockImplementation(({ trialId }) =>
    Promise.resolve(
      trialId === undefined
        ? { data: TRIALS, total: 600 }
        : {
            data: TRIALS.filter((entry) => entry.trialId === trialId),
            total: 1,
          },
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.mocked(selectRunSummaries).mockReset();
  vi.mocked(selectRunTrials).mockReset();
});

describe('EvalsRun', () => {
  it('titles the run by suite and branch under a trail back to the overview', async () => {
    await renderAt(RUN_PATH);

    expect(breadcrumbTrail()).toEqual(evalsTrail(`run ${RUN_ID}`));
  });

  it('lists the facts of the run as terms and values', async () => {
    await renderAt(RUN_PATH);

    const terms = screen
      .getAllByRole('term')
      .map(({ textContent }) => textContent);
    const values = screen
      .getAllByRole('definition')
      .map(({ textContent }) => textContent);

    expect(terms.slice(0, 3)).toEqual(['Suite', 'Pass rate', 'Interval']);
    expect(values.slice(0, 2)).toEqual(['skills', '50% (1/2)']);
    expect(terms).toHaveLength(15);
  });

  it('links each chart point to its trial and notes a chart cut short', async () => {
    await renderAt(RUN_PATH);

    const chart = screen.getByRole('group', {
      name: 'Duration of each of the 2 trials',
    });

    expect(
      within(chart)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual([`${RUN_PATH}?trial=7`, `${RUN_PATH}?trial=8`]);
    expect(
      screen.getByText('The chart shows the first 2 of 600 trials.'),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Settings for / })).toBeNull();
  });

  it('shows no trial panel until a trial is chosen', async () => {
    await renderAt(RUN_PATH);

    expect(screen.queryByRole('region', { name: /^Trial / })).toBeNull();
  });

  it('shows the chosen trial with a link that clears it', async () => {
    await renderAt(`${RUN_PATH}?trial=8`);

    const panel = screen.getByRole('region', { name: 'Trial 8' });

    expect(panel.textContent).toBe(`${trialSummaryLabel(RUN_TRIAL)} Clear`);
    expect(
      within(panel).getByRole('link', { name: 'Clear' }).getAttribute('href'),
    ).toBe(RUN_PATH);
  });

  it('hydrates the server markup of a chosen trial without a mismatch', async () => {
    await expectHydratesWithoutMismatch({
      path: `${RUN_PATH}?trial=8`,
      routes: [ROUTE],
    });
  });
});
