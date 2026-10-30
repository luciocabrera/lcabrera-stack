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
import { SEED_RUNS } from './seedStory';

const confusion = (runId: string) => `/evals/confusion?run=${runId}`;

const CHOICES = [
  ['2026-10-14 02:00 on feat/trigger-wording', SEED_RUNS.featureSkills],
  ['2026-10-13 02:00 on main', SEED_RUNS.skillsLatest],
  ['2026-10-12 02:00 on main', SEED_RUNS.skillsPrevious],
  ['2026-10-10 02:00 on main', SEED_RUNS.skillsSecond],
  ['2026-10-05 02:00 on main', SEED_RUNS.skillsFirst],
  ['2026-10-03 02:00 on feat/skipped', SEED_RUNS.skippedSkills],
] as const;

const TRIGGERED = 'react-19 38 · 7 · 45';
const NEAR_MISS = 'not store-pattern · 3 12 · 15';
const ERRORED = 'store-pattern · 9 3 3 15';

it('offers the recent runs, marking the current one and linking the rest by ?run=', async ({
  page,
}) => {
  await openEvals(page, '/evals/confusion');

  const runs = page.getByRole('navigation', { exact: true, name: 'Runs' });

  await expect(runs.getByRole('listitem')).toHaveText([
    'Recent runs',
    ...CHOICES.map(([label]) => label),
  ]);
  await expect(
    runs.getByRole('link', { exact: true, name: 'Recent runs' }),
  ).toHaveCount(0);

  for (const [name, runId] of CHOICES) {
    await expectLink({ href: confusion(runId), name, scope: runs });
  }

  await expect(
    mainOf(page).getByRole('link', { exact: true, name: 'Open the run' }),
  ).toHaveCount(0);

  await runs
    .getByRole('link', {
      exact: true,
      name: '2026-10-14 02:00 on feat/trigger-wording',
    })
    .click();
  await expect(page).toHaveURL(confusion(SEED_RUNS.featureSkills));
  await expect(
    runs.getByRole('link', {
      exact: true,
      name: '2026-10-14 02:00 on feat/trigger-wording',
    }),
  ).toHaveCount(0);
  await expectLink({
    href: '/evals/confusion',
    name: 'Recent runs',
    scope: runs,
  });
  await expectLink({
    href: `/evals/runs/${SEED_RUNS.featureSkills}`,
    name: 'Open the run',
    scope: mainOf(page),
  });
});

it('draws the matrix with one column per loaded skill plus Trials', async ({
  page,
}) => {
  await openEvals(page, '/evals/confusion');

  await expect(mainOf(page).getByRole('columnheader')).toHaveText([
    String.raw`Expected \ loaded`,
    'react-19',
    'store-pattern',
    '(none)',
    '(error)',
    'Trials',
  ]);
  await expect(rowOf(page, NEAR_MISS)).toBeVisible();
  await expect(rowOf(page, TRIGGERED)).toBeVisible();
  await expect(rowOf(page, ERRORED)).toBeVisible();
});

it('styles an empty cell and a misload apart from an expected load', async ({
  page,
}) => {
  await openEvals(page, '/evals/confusion');

  const triggered = cellsOf(rowOf(page, TRIGGERED));
  const expected = await colorOf(
    triggered.nth(1).getByText('38', { exact: true }),
  );
  const empty = await colorOf(triggered.nth(2).getByText('·', { exact: true }));
  const misload = await colorOf(
    triggered.nth(3).getByText('7', { exact: true }),
  );

  const nearMiss = cellsOf(rowOf(page, NEAR_MISS));

  expect(new Set([empty, expected, misload]).size).toBe(3);
  expect(await colorOf(nearMiss.nth(2).getByText('3', { exact: true }))).toBe(
    misload,
  );
  expect(await colorOf(nearMiss.nth(3).getByText('12', { exact: true }))).toBe(
    expected,
  );
});

it('narrows the matrix to one run', async ({ page }) => {
  await openEvals(page, confusion(SEED_RUNS.featureSkills));

  await expect(mainOf(page).getByRole('columnheader')).toHaveText([
    String.raw`Expected \ loaded`,
    'react-19',
    'store-pattern',
    '(none)',
    'Trials',
  ]);
  await expect(rowOf(page, 'not store-pattern · 3 · 3')).toBeVisible();
  await expect(rowOf(page, 'react-19 6 · 3 9')).toBeVisible();
  await expect(rowOf(page, 'store-pattern · · 3 3')).toBeVisible();
  await expect(rowOf(page, TRIGGERED)).toHaveCount(0);
});

it('says so when the run holds no trigger or near-miss trial', async ({
  page,
}) => {
  await openEvals(page, confusion(SEED_RUNS.skippedSkills));

  await expect(mainOf(page)).toContainText(
    'No trigger or near-miss trial is stored for the run of 2026-10-03 02:00 on feat/skipped.',
  );
  await expect(mainOf(page).getByRole('columnheader')).toHaveCount(0);
});

it('renders the confusion page in light and dark', async ({
  page,
}, testInfo) => {
  await captureThemes({
    name: 'confusion',
    page,
    path: '/evals/confusion',
    testInfo,
  });
});
