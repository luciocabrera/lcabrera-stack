import { expect, test as it } from '@playwright/test';

import {
  clickMenuAction,
  columnHeader,
  expectDatasetCount,
  firstBodyCell,
  headerLabels,
  openColumnMenu,
  openGrid,
  openSettings,
  scrollToEnd,
  selectTab,
  visiblePanel,
} from '../grid';
import {
  captureThemes,
  expectFacts,
  expectLink,
  expectTrialHref,
  mainOf,
} from './evalsPage';
import { SEED_RUNS } from './seedStory';

const LATEST = `/evals/runs/${SEED_RUNS.skillsLatest}`;
const VERIFIER = `/evals/runs/${SEED_RUNS.verifier}`;

const COLUMNS = [
  'Trial',
  'Task',
  'Subject',
  'Kind',
  'Index',
  'Outcome',
  'Error class',
  'Duration (ms)',
  'Turns',
  'Tokens in',
  'Tokens out',
  'Cost (USD)',
  'Expected skill',
  'Invoked',
  'Verdict',
  'Overall',
];

it('shows the breadcrumb, the title and the facts of the run', async ({
  page,
}) => {
  await openGrid(page, LATEST);

  await expectLink({ href: '/evals', name: 'Evals', scope: mainOf(page) });
  await expect(mainOf(page)).toContainText(
    `Evals / run ${SEED_RUNS.skillsLatest}`,
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'skills on main',
  );
  await expectFacts(page, [
    ['Suite', 'skills'],
    ['Pass rate', '85% (11/13)'],
    ['Interval', '58% to 96%'],
    ['Cost', '$1.80'],
    ['Duration', '5m 0s'],
    ['Status', 'complete'],
    ['Trigger', 'ci-scheduled'],
    ['Branch', 'main'],
    ['Commit', 'a8b82004de13'],
    ['Started', '2026-10-13 02:00:00'],
    ['Model', 'claude-opus-5-5'],
    ['Harness', '49f756463ad9'],
    ['Runs per task', '3'],
    ['Node', 'v26.10.0'],
    ['OS', 'linux x64'],
  ]);
});

it('charts each trial duration, and a point selects its trial until Clear', async ({
  page,
}) => {
  await openGrid(page, LATEST);

  const chart = page.getByRole('figure', {
    exact: true,
    name: 'Duration of each of the 15 trials',
  });

  await expect(chart.getByRole('link')).toHaveCount(15);
  await expect(mainOf(page)).not.toContainText('The chart shows the first');

  const point = chart.getByRole('link', {
    exact: true,
    name: 'skills/store-pattern/trigger-1 trial 1: error, 30s',
  });
  const trialId = await expectTrialHref({
    runId: SEED_RUNS.skillsLatest,
    target: point,
  });

  await point.click();
  await expect(page).toHaveURL(`${LATEST}?trial=${trialId}`);

  const panel = page.getByRole('region', {
    exact: true,
    name: `Trial ${String(trialId)}`,
  });

  await expect(panel).toHaveText(
    `Trial ${String(trialId)}: skills/store-pattern/trigger-1 trial 1, error (rate_limit), 30s, 4 turns, $0.12. Clear`,
  );
  await panel.getByRole('link', { exact: true, name: 'Clear' }).click();
  await expect(page).toHaveURL(LATEST);
  await expect(panel).toHaveCount(0);
});

it('notes that the chart shows the first 500 of a larger run', async ({
  page,
}) => {
  await openGrid(page, VERIFIER);

  await expect(
    page
      .getByRole('figure', {
        exact: true,
        name: 'Duration of each of the 500 trials',
      })
      .getByRole('link'),
  ).toHaveCount(500);
  await expect(mainOf(page)).toContainText(
    'The chart shows the first 500 of 510 trials.',
  );
});

it('lists the trials in the 16-column table, sorted by a column', async ({
  page,
}) => {
  await openGrid(page, VERIFIER);

  await expect.poll(() => headerLabels(page)).toEqual(COLUMNS);
  await expectDatasetCount(page, 510);
  await expect(firstBodyCell(page, 'taskKey')).toHaveText(
    'verifier-fixtures/fixture-001',
  );

  await openColumnMenu(page, 'Duration (ms)');
  await clickMenuAction(page, 'Descending');
  await expect(columnHeader(page, 'Duration (ms)')).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await expect(page).toHaveURL(
    /[?&]sorting=%7B%22durationMs%22%3A%22desc%22%7D/u,
  );
  await expect(firstBodyCell(page, 'durationMs')).toHaveText('30,000');
});

it('pages the trials in from the trials route as the table scrolls', async ({
  page,
}) => {
  await openGrid(page, VERIFIER);

  const nextPage = page.waitForRequest(
    (request) =>
      request.url().includes(`${VERIFIER}/trials?`) &&
      new URL(request.url()).searchParams.get('skip') === '50',
  );

  await scrollToEnd(page);
  await nextPage;
  await expectDatasetCount(page, 510);
});

it('keeps the trials table without filters', async ({ page }) => {
  await openGrid(page, VERIFIER);
  await openSettings(page);
  await selectTab(page, 'Filters');

  await expect(visiblePanel(page)).toContainText('No filters applied.');
  await expect(page).not.toHaveURL(/filters=/u);
});

it('renders the run in light and dark', async ({ page }, testInfo) => {
  await captureThemes({ name: 'run', page, path: LATEST, testInfo });
});
