import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  cellsOf,
  colorOf,
  expectLink,
  mainOf,
  openEvals,
  rowOf,
} from './evalsPage';
import { SEED_RUNS, SEED_TASKS } from './seedStory';

const run = (runId: string) => `/evals/runs/${runId}`;

const WOBBLY_ROW = `${SEED_TASKS.wobbly} 2 of 4 0/0, 3 not scored 2/3 2/3 3/3 3/3 3/3`;

it('opens with a note that links to the overview', async ({ page }) => {
  await openEvals(page, '/evals/flaky');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Flaky tasks',
  );
  await expectLink({
    href: '/evals',
    name: 'the overview',
    scope: mainOf(page),
  });
  await expect(mainOf(page)).toContainText(
    "Per suite, the tasks the regression rule behind the banner on the overview leaves out when it judges main's latest run against the one before. Such a task had trials that disagreed in more than 20% of its last 10 runs, not counting those two runs,",
  );
});

it('states the basis of each suite: the judged pair, or fewer than two main runs', async ({
  page,
}) => {
  await openEvals(page, '/evals/flaky');

  for (const suite of [
    'rules-consistency',
    'skill-quality',
    'skills',
    'verifier-fixtures',
  ]) {
    await expect(
      mainOf(page).getByRole('heading', { exact: true, name: suite }),
    ).toBeVisible();
  }

  await expect(mainOf(page)).toContainText(
    'Left out when judging 2026-10-13 02:00 on main against 2026-10-12 02:00 on main. Neither run counts toward flakiness.',
  );
  await expectLink({
    href: run(SEED_RUNS.skillsLatest),
    name: '2026-10-13 02:00 on main',
    scope: mainOf(page),
  });
  await expectLink({
    href: run(SEED_RUNS.skillsPrevious),
    name: '2026-10-12 02:00 on main',
    scope: mainOf(page),
  });
  await expectLink({
    href: run(SEED_RUNS.qualityLatest),
    name: '2026-10-16 03:00 on main',
    scope: mainOf(page),
  });
  await expectLink({
    href: run(SEED_RUNS.qualityPrevious),
    name: '2026-10-15 03:00 on main',
    scope: mainOf(page),
  });
  await expect(
    mainOf(page).getByText(
      'Fewer than two main runs, so there is no pair to judge and no run is left out of the count.',
    ),
  ).toHaveCount(2);
  await expect(
    mainOf(page).getByText('No flaky task is left out.', { exact: true }),
  ).toHaveCount(2);
});

it('lists each flaky task with its split runs and one dated column per run', async ({
  page,
}) => {
  await openEvals(page, '/evals/flaky');

  await expect(
    page.getByRole('columnheader', { exact: true, name: 'Task' }),
  ).toHaveCount(2);
  await expect(
    page.getByRole('columnheader', { exact: true, name: 'Split runs' }),
  ).toHaveCount(2);

  for (const date of [
    '2026-10-03',
    '2026-10-05',
    '2026-10-10',
    '2026-10-12',
    '2026-10-13',
    '2026-10-14',
    '2026-10-17',
  ]) {
    await expect(
      page.getByRole('columnheader', { exact: true, name: date }),
    ).toBeVisible();
  }

  const wobbly = rowOf(page, WOBBLY_ROW);

  await expect(wobbly).toBeVisible();
  await expect(
    rowOf(page, 'verifier-fixtures/fixture-001 1 of 1 2/3'),
  ).toBeVisible();
  await expect(
    rowOf(page, 'verifier-fixtures/fixture-086 1 of 1 2/3'),
  ).toBeVisible();

  const links = wobbly.getByRole('link');

  await expect(links).toHaveText([
    '0/0, 3 not scored',
    '2/3',
    '2/3',
    '3/3',
    '3/3',
    '3/3',
  ]);

  for (const [index, runId] of [
    SEED_RUNS.skippedSkills,
    SEED_RUNS.skillsFirst,
    SEED_RUNS.skillsSecond,
    SEED_RUNS.skillsPrevious,
    SEED_RUNS.skillsLatest,
    SEED_RUNS.featureSkills,
  ].entries()) {
    await expect(links.nth(index)).toHaveAttribute('href', run(runId));
  }
});

it('marks the cells whose trials split apart from the rest', async ({
  page,
}) => {
  await openEvals(page, '/evals/flaky');

  const cells = cellsOf(rowOf(page, WOBBLY_ROW));
  const split = await colorOf(cells.nth(3).getByRole('link'));
  const steady = await colorOf(cells.nth(5).getByRole('link'));

  expect(await colorOf(cells.nth(4).getByRole('link'))).toBe(split);
  expect(split).not.toBe(steady);
  expect(await colorOf(cells.nth(2).getByRole('link'))).toBe(steady);
});

it('renders the flaky page in light and dark', async ({ page }, testInfo) => {
  await captureThemes({ name: 'flaky', page, path: '/evals/flaky', testInfo });
});
