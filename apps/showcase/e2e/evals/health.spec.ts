import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  cellsOf,
  colorOf,
  expectFacts,
  expectLink,
  mainOf,
  openEvals,
  paintOf,
  rowOf,
} from './evalsPage';
import { SEED_RUNS } from './seedStory';

const run = (runId: string) => `/evals/runs/${runId}`;

const QUIET = ['0', '0', '0'] as const;

const facts = (
  runs: string,
  trials: string,
  [errors, timeouts, rateLimits]: readonly [string, string, string],
) =>
  [
    ['Runs', runs],
    ['Trials', trials],
    ['Errors', errors],
    ['Timeouts', timeouts],
    ['Rate limits', rateLimits],
  ] as const;

it('counts runs, trials, errors, timeouts and rate limits per suite', async ({
  page,
}) => {
  await openEvals(page, '/evals/health');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Run health',
  );
  await expect(mainOf(page)).toContainText(
    'A rate limit is an error of class rate_limit or session_limit, so it counts among the errors too.',
  );
  await expectFacts(page, [
    ...facts('1', '3', QUIET),
    ...facts('5', '10', QUIET),
    ...facts('6', '90', ['2', '1', '1']),
    ...facts('1', '510', QUIET),
  ]);
  await expect(
    mainOf(page).getByText('No error or timeout in its last 1 runs.', {
      exact: true,
    }),
  ).toHaveCount(2);
  await expect(
    mainOf(page).getByText('No error or timeout in its last 5 runs.', {
      exact: true,
    }),
  ).toHaveCount(1);
});

it('draws a sparkline of errors and timeouts per run', async ({ page }) => {
  await openEvals(page, '/evals/health');

  const chart = page.getByRole('figure', {
    exact: true,
    name: 'skills errors and timeouts per run over its last 6 runs',
  });
  const troubled = chart.getByRole('link', {
    exact: true,
    name: '2026-10-13 02:00 on main: 1 errors, 1 timeouts',
  });
  const clean = chart.getByRole('link', {
    exact: true,
    name: '2026-10-12 02:00 on main: 0 errors, 0 timeouts',
  });

  await expect(chart.getByRole('link')).toHaveCount(6);
  await expect(troubled).toHaveAttribute('href', run(SEED_RUNS.skillsLatest));
  await expect(clean).toHaveAttribute('href', run(SEED_RUNS.skillsPrevious));
  expect(await paintOf(troubled)).not.toBe(await paintOf(clean));
});

it('breaks the errors down by class and highlights the rate limit', async ({
  page,
}) => {
  await openEvals(page, '/evals/health');

  for (const name of ['Outcome', 'Error class']) {
    await expect(
      page.getByRole('columnheader', { exact: true, name }),
    ).toHaveCount(1);
  }

  const maxTurns = rowOf(page, 'error error_max_turns 1 1');
  const rateLimit = rowOf(page, 'error rate_limit 1 1');

  await expect(maxTurns).toBeVisible();
  await expect(rateLimit).toBeVisible();
  await expect(rowOf(page, 'timeout unclassified 1 1')).toBeVisible();
  expect(
    await colorOf(
      cellsOf(rateLimit).nth(1).getByText('rate_limit', { exact: true }),
    ),
  ).not.toBe(
    await colorOf(
      cellsOf(maxTurns).nth(1).getByText('error_max_turns', { exact: true }),
    ),
  );
});

it('lists the troubled runs, newest first, linking each run', async ({
  page,
}) => {
  await openEvals(page, '/evals/health');

  for (const name of ['Run', 'Errors', 'Timeouts', 'Rate limits']) {
    await expect(
      page.getByRole('columnheader', { exact: true, name }),
    ).toHaveCount(1);
  }

  const latest = rowOf(page, '2026-10-13 02:00 on main 15 1 1 1');
  const second = rowOf(page, '2026-10-10 02:00 on main 15 1 0 0');

  await expectLink({
    href: run(SEED_RUNS.skillsLatest),
    name: '2026-10-13 02:00 on main',
    scope: latest,
  });
  await expectLink({
    href: run(SEED_RUNS.skillsSecond),
    name: '2026-10-10 02:00 on main',
    scope: second,
  });
  await expect(
    mainOf(page)
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: / on main$/u }) }),
  ).toHaveText([
    /^\s*2026-10-13 02:00 on main\s*15\s*1\s*1\s*1\s*$/u,
    /^\s*2026-10-10 02:00 on main\s*15\s*1\s*0\s*0\s*$/u,
  ]);
});

it('renders the health page in light and dark', async ({ page }, testInfo) => {
  await captureThemes({
    name: 'health',
    page,
    path: '/evals/health',
    testInfo,
  });
});
