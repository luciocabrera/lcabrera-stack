import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  cellsOf,
  colorOf,
  expectLink,
  expectRightAligned,
  mainOf,
  openEvals,
  rowOf,
} from './evalsPage';
import { SEED_FEATURE_BRANCH, SEED_RUNS, SEED_TASKS } from './seedStory';

const run = (runId: string) => `/evals/runs/${runId}`;

const pair = (a: string, b: string) => `/evals/compare?a=${a}&b=${b}`;

const CHOICES = [
  'rules-consistency, 2026-10-18 05:00 on main: no scored trials',
  'skill-quality, 2026-10-16 03:00 on main: 50% (1/2)',
  'skill-quality, 2026-10-15 03:00 on main: 100% (2/2)',
  'skill-quality, 2026-10-09 03:00 on main: 100% (2/2)',
  'skill-quality, 2026-10-08 03:00 on main: 100% (2/2)',
  'skill-quality, 2026-10-07 03:00 on main: 100% (2/2)',
  'skills, 2026-10-14 02:00 on feat/trigger-wording: 40% (6/15)',
  'skills, 2026-10-13 02:00 on main: 85% (11/13)',
  'skills, 2026-10-12 02:00 on main: 100% (15/15)',
  'skills, 2026-10-10 02:00 on main: 93% (13/14)',
  'skills, 2026-10-05 02:00 on main: 93% (14/15)',
  'skills, 2026-10-03 02:00 on feat/skipped: no scored trials',
  'verifier-fixtures, 2026-10-17 04:00 on main: 100% (508/510)',
];

it('offers Run A and Run B pickers reading suite, date, branch and pass rate', async ({
  page,
}) => {
  await openEvals(page, '/evals/compare');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Compare runs',
  );
  await expectLink({ href: '/evals', name: 'Evals', scope: mainOf(page) });

  for (const side of ['Run A', 'Run B']) {
    await expect(
      page
        .getByRole('combobox', { exact: true, name: side })
        .getByRole('option'),
    ).toHaveText(CHOICES);
  }

  await expect(page.getByRole('combobox', { name: 'Run A' })).toHaveValue(
    SEED_RUNS.qualityLatest,
  );
  await expect(page.getByRole('combobox', { name: 'Run B' })).toHaveValue(
    SEED_RUNS.rules,
  );
  await expect(
    page.getByRole('textbox', { exact: true, name: 'Branch' }),
  ).toHaveAttribute('placeholder', 'feat/…');
});

it('submits the picked pair as ?a=&b=', async ({ page }) => {
  await openEvals(page, '/evals/compare');

  await page
    .getByRole('combobox', { name: 'Run A' })
    .selectOption(SEED_RUNS.skillsPrevious);
  await page
    .getByRole('combobox', { name: 'Run B' })
    .selectOption(SEED_RUNS.skillsLatest);
  await page.getByRole('button', { exact: true, name: 'Compare runs' }).click();

  await expect(page).toHaveURL(
    pair(SEED_RUNS.skillsPrevious, SEED_RUNS.skillsLatest),
  );
  await expect(
    page.getByRole('heading', { exact: true, name: 'Flipped tasks' }),
  ).toBeVisible();
});

it('submits the branch as ?branch= and compares it with main', async ({
  page,
}) => {
  await openEvals(page, '/evals/compare');

  await page.getByRole('textbox', { name: 'Branch' }).fill(SEED_FEATURE_BRANCH);
  await page
    .getByRole('button', { exact: true, name: 'Compare with main' })
    .click();

  await expect(page).toHaveURL('/evals/compare?branch=feat%2Ftrigger-wording');
  await expectLink({
    href: run(SEED_RUNS.skillsLatest),
    name: 'skills, 2026-10-13 02:00 on main: 85% (11/13)',
    scope: mainOf(page),
  });
  await expectLink({
    href: run(SEED_RUNS.featureSkills),
    name: 'skills, 2026-10-14 02:00 on feat/trigger-wording: 40% (6/15)',
    scope: mainOf(page),
  });
  await expect(
    page.getByRole('columnheader', { exact: true, name: 'Change' }),
  ).toHaveCount(2);
  await expect(
    rowOf(page, 'skills/react-19/trigger-1 react-19 3/3 0/3 regressed'),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'skills/store-pattern/near-miss-1 store-pattern 3/3 0/3 regressed',
    ),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'skills/store-pattern/trigger-1 store-pattern 1/1, 2 not scored 0/3 regressed',
    ),
  ).toBeVisible();
  await expect(
    rowOf(page, 'skills/react-19/trigger-2 react-19 1/3 3/3 improved'),
  ).toBeVisible();
  await expect(mainOf(page)).toContainText('One cause: skill catalog.');
});

it('links both runs, lists the flipped task and the totals of a pair', async ({
  page,
}) => {
  await openEvals(page, pair(SEED_RUNS.skillsPrevious, SEED_RUNS.skillsLatest));

  await expectLink({
    href: run(SEED_RUNS.skillsPrevious),
    name: 'skills, 2026-10-12 02:00 on main: 100% (15/15)',
    scope: mainOf(page),
  });
  await expectLink({
    href: run(SEED_RUNS.skillsLatest),
    name: 'skills, 2026-10-13 02:00 on main: 85% (11/13)',
    scope: mainOf(page),
  });

  for (const name of ['Task', 'Subject', 'A', 'B', 'Change', 'Total']) {
    await expect(
      page.getByRole('columnheader', { exact: true, name }).first(),
    ).toBeVisible();
  }

  const flip = rowOf(page, `${SEED_TASKS.dropped} react-19 3/3 1/3 regressed`);

  await expectLink({
    href: '/evals/subjects/skill/react-19',
    name: 'react-19',
    scope: flip,
  });
  await expect(
    rowOf(page, 'Pass rate 100% (15/15) 85% (11/13) -15.4 pts'),
  ).toBeVisible();
  await expect(
    rowOf(page, 'Interval 80% to 100% 58% to 96% overlapping'),
  ).toBeVisible();
  await expect(rowOf(page, 'Trials 15 15 no change')).toBeVisible();
  await expect(
    rowOf(page, 'Cost (Reported by the SDK) $1.80 $1.80 no change'),
  ).toBeVisible();
  await expect(rowOf(page, 'Duration 5m 0s 5m 0s no change')).toBeVisible();
  await expectRightAligned(
    cellsOf(rowOf(page, 'Trials 15 15 no change')).nth(1),
  );
  await expect(
    page.getByRole('heading', { exact: true, name: 'Changed inputs' }),
  ).toBeVisible();
  await expect(mainOf(page)).toContainText(
    'No input hash changed between the runs.',
  );
});

it('highlights a regressed task apart from an improved one', async ({
  page,
}) => {
  await openEvals(page, '/evals/compare?branch=feat%2Ftrigger-wording');

  const regressed = cellsOf(
    rowOf(page, 'skills/react-19/trigger-1 react-19 3/3 0/3 regressed'),
  ).nth(4);
  const improved = cellsOf(
    rowOf(page, 'skills/react-19/trigger-2 react-19 1/3 3/3 improved'),
  ).nth(4);

  expect(
    await colorOf(regressed.getByText('regressed', { exact: true })),
  ).not.toBe(await colorOf(improved.getByText('improved', { exact: true })));
});

it('says so when no task flipped, and names every changed input', async ({
  page,
}) => {
  await openEvals(page, pair(SEED_RUNS.skillsFirst, SEED_RUNS.skillsSecond));

  await expect(mainOf(page)).toContainText(
    'None of the 5 tasks changed its verdict.',
  );
  await expect(
    page.getByRole('columnheader', { exact: true, name: 'Task' }),
  ).toHaveCount(0);
  await expect(
    rowOf(page, 'Pass rate 93% (14/15) 93% (13/14) -0.5 pts'),
  ).toBeVisible();
  await expect(
    rowOf(page, 'Interval 70% to 99% 69% to 99% overlapping'),
  ).toBeVisible();
  await expect(mainOf(page)).toContainText(
    '2 inputs changed: model, skill react-19 content.',
  );
});

it('renders the picker and a comparison in light and dark', async ({
  page,
}, testInfo) => {
  await captureThemes({
    name: 'compare-picker',
    page,
    path: '/evals/compare',
    testInfo,
  });
  await captureThemes({
    name: 'compare-report',
    page,
    path: '/evals/compare?branch=feat%2Ftrigger-wording',
    testInfo,
  });
});
