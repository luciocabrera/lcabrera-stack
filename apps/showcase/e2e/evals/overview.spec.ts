import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  expectFacts,
  expectLink,
  mainOf,
  openEvals,
} from './evalsPage';
import { SEED_RUNS, SEED_TASKS } from './seedStory';

const run = (runId: string) => `/evals/runs/${runId}`;

const VIEWS = [
  ['Compare runs', '/evals/compare'],
  ['Heatmap', '/evals/heatmap'],
  ['Cost and latency', '/evals/cost'],
  ['Flaky tasks', '/evals/flaky'],
  ['Trigger confusion', '/evals/confusion'],
  ['Quality dimensions', '/evals/quality'],
  ['Run health', '/evals/health'],
] as const;

it('links to each of the seven views', async ({ page }) => {
  await openEvals(page, '/evals');

  const views = page.getByRole('navigation', { name: 'Eval views' });

  await expect(views.getByRole('link')).toHaveCount(VIEWS.length);

  for (const [name, href] of VIEWS) {
    await expectLink({ href, name, scope: views });
  }
});

it('raises one alert for the suite that regressed on main, with its finding and the flaky note', async ({
  page,
}) => {
  await openEvals(page, '/evals');

  const alert = mainOf(page).getByRole('alert');

  await expect(alert).toHaveCount(1);
  await expect(alert).toContainText(
    'skills regressed on main in the latest run against the run before. Compare them.',
  );
  await expectLink({
    href: run(SEED_RUNS.skillsLatest),
    name: 'the latest run',
    scope: alert,
  });
  await expectLink({
    href: run(SEED_RUNS.skillsPrevious),
    name: 'the run before',
    scope: alert,
  });
  await expectLink({
    href: `/evals/compare?a=${SEED_RUNS.skillsPrevious}&b=${SEED_RUNS.skillsLatest}`,
    name: 'Compare them',
    scope: alert,
  });
  await expect(alert.getByRole('listitem')).toHaveText([
    `skill react-19: ${SEED_TASKS.dropped} failed 2 of 3 trials after passing every trial the run before`,
  ]);
  await expect(alert).toContainText(
    '1 flaky task was left out of the rule; see the flaky tasks.',
  );
  await expectLink({
    href: '/evals/flaky',
    name: 'see the flaky tasks',
    scope: alert,
  });
});

it('draws one card per suite with its facts', async ({ page }) => {
  await openEvals(page, '/evals');

  for (const [suite, runId] of [
    ['rules-consistency', SEED_RUNS.rules],
    ['skill-quality', SEED_RUNS.qualityLatest],
    ['skills', SEED_RUNS.featureSkills],
    ['verifier-fixtures', SEED_RUNS.verifier],
  ] as const) {
    const heading = mainOf(page).getByRole('heading', {
      exact: true,
      name: suite,
    });

    await expect(heading).toBeVisible();
    await expectLink({ href: run(runId), name: suite, scope: heading });
  }

  await expectFacts(page, [
    ['Pass rate', 'no scored trials'],
    ['Interval', 'too few trials for an interval'],
    ['Cost', 'not reported'],
    ['Duration', '5m 0s'],
    ['Flaky, left out', 'no main pair to judge'],
    ['Run', '2026-10-18 05:00 on main at e72f8259'],
    ['Pass rate', '50% (1/2)'],
    ['Interval', 'too few trials for an interval'],
    ['Cost', '$0.24'],
    ['Duration', '5m 0s'],
    ['Flaky, left out', '0 tasks'],
    ['Run', '2026-10-16 03:00 on main at 22bfbb53'],
    ['Pass rate', '40% (6/15)'],
    ['Interval', '20% to 64%'],
    ['Cost', '$1.80'],
    ['Duration', '5m 0s'],
    ['Flaky, left out', '1 tasks'],
    ['Run', '2026-10-14 02:00 on feat/trigger-wording at 602ecaae'],
    ['Pass rate', '100% (508/510)'],
    ['Interval', '99% to 100%'],
    ['Cost', '$61.20'],
    ['Duration', '5m 0s'],
    ['Flaky, left out', 'no main pair to judge'],
    ['Run', '2026-10-17 04:00 on main at b1982c09'],
  ]);
  await expectLink({
    href: '/evals/flaky',
    name: '1 tasks',
    scope: mainOf(page),
  });
  await expectLink({
    href: '/evals/flaky',
    name: '0 tasks',
    scope: mainOf(page),
  });
});

it('draws a pass-rate sparkline per suite whose points open their runs', async ({
  page,
}) => {
  await openEvals(page, '/evals');

  const skills = page.getByRole('figure', {
    exact: true,
    name: 'skills pass rate over its last 5 runs',
  });

  await expect(skills.getByRole('link')).toHaveCount(5);
  await expectLink({
    href: run(SEED_RUNS.skillsFirst),
    name: 'Run 51000000, 2026-10-05 on main: 93% (14/15)',
    scope: skills,
  });
  await expectLink({
    href: run(SEED_RUNS.skillsSecond),
    name: 'Run 52000000, 2026-10-10 on main: 93% (13/14)',
    scope: skills,
  });
  await expectLink({
    href: run(SEED_RUNS.skillsPrevious),
    name: 'Run 53000000, 2026-10-12 on main: 100% (15/15)',
    scope: skills,
  });
  await expectLink({
    href: run(SEED_RUNS.skillsLatest),
    name: 'Run 54000000, 2026-10-13 on main: 85% (11/13)',
    scope: skills,
  });
  await expectLink({
    href: run(SEED_RUNS.featureSkills),
    name: 'Run f1000000, 2026-10-14 on feat/trigger-wording: 40% (6/15)',
    scope: skills,
  });
  await expect(
    page
      .getByRole('figure', {
        exact: true,
        name: 'skill-quality pass rate over its last 5 runs',
      })
      .getByRole('link'),
  ).toHaveCount(5);
  await expect(
    page
      .getByRole('figure', {
        exact: true,
        name: 'verifier-fixtures pass rate over its last 1 runs',
      })
      .getByRole('link'),
  ).toHaveCount(1);
  await expect(
    page
      .getByRole('figure', {
        exact: true,
        name: 'rules-consistency pass rate over its last 0 runs',
      })
      .getByRole('link'),
  ).toHaveCount(0);

  await skills
    .getByRole('link', {
      name: 'Run 53000000, 2026-10-12 on main: 100% (15/15)',
    })
    .click();
  await expect(page).toHaveURL(run(SEED_RUNS.skillsPrevious));
  await expect(
    page.getByRole('heading', { level: 1, name: 'skills on main' }),
  ).toBeVisible();
});

it('renders the overview in light and dark', async ({ page }, testInfo) => {
  await captureThemes({ name: 'overview', page, path: '/evals', testInfo });
});
