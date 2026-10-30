import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  expectLink,
  expectTrialHref,
  mainOf,
  openEvals,
  paintOf,
} from './evalsPage';
import { SEED_RUNS } from './seedStory';

const run = (runId: string) => `/evals/runs/${runId}`;

const cell = (name: string) => `${name}; open trial`;

it('draws a grid per suite with subjects as rows and runs as columns', async ({
  page,
}) => {
  await openEvals(page, '/evals/heatmap');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Heatmap');
  await expect(mainOf(page)).toContainText(
    'Green is a pass rate of 90% or more, amber 50% or more, red below.',
  );
  await expect(mainOf(page)).toContainText('(3 tasks now)');

  for (const [suite, shape] of [
    ['rules-consistency', '1 subjects over 1 runs'],
    ['skill-quality', '2 subjects over 5 runs'],
    ['skills', '2 subjects over 6 runs'],
    ['verifier-fixtures', '1 subjects over 1 runs'],
  ] as const) {
    await expect(
      mainOf(page).getByRole('heading', { exact: true, name: suite }),
    ).toBeVisible();
    await expect(
      page.getByRole('figure', { exact: true, name: `${suite}: ${shape}` }),
    ).toBeVisible();
  }
});

it('links each run column, each row label and each cell', async ({ page }) => {
  await openEvals(page, '/evals/heatmap');

  const skills = page.getByRole('figure', {
    exact: true,
    name: 'skills: 2 subjects over 6 runs',
  });

  for (const [name, runId] of [
    ['Run e0000000, 2026-10-03', SEED_RUNS.skippedSkills],
    ['Run 51000000, 2026-10-05', SEED_RUNS.skillsFirst],
    ['Run 52000000, 2026-10-10', SEED_RUNS.skillsSecond],
    ['Run 53000000, 2026-10-12', SEED_RUNS.skillsPrevious],
    ['Run 54000000, 2026-10-13', SEED_RUNS.skillsLatest],
    ['Run f1000000, 2026-10-14', SEED_RUNS.featureSkills],
  ] as const) {
    await expectLink({ href: run(runId), name, scope: skills });
  }

  await expectLink({
    href: '/evals/subjects/skill/react-19',
    name: 'react-19',
    scope: skills,
  });
  await expectLink({
    href: '/evals/subjects/skill/store-pattern',
    name: 'store-pattern',
    scope: skills,
  });
  await expectTrialHref({
    runId: SEED_RUNS.skillsLatest,
    target: skills.getByRole('link', {
      name: cell('store-pattern, 2026-10-13: 100% (4/4)'),
    }),
  });
  await expect(
    skills.getByRole('link', { name: /^(react-19|store-pattern), / }),
  ).toHaveCount(12);
});

it('colours each cell by its pass rate and hatches the flaky ones', async ({
  page,
}) => {
  await openEvals(page, '/evals/heatmap');

  const skills = page.getByRole('figure', {
    exact: true,
    name: 'skills: 2 subjects over 6 runs',
  });
  const high = await paintOf(
    skills.getByRole('link', {
      name: cell('store-pattern, 2026-10-12: 100% (6/6)'),
    }),
  );
  const low = await paintOf(
    skills.getByRole('link', {
      name: cell('store-pattern, 2026-10-14: 0% (0/6)'),
    }),
  );
  const none = await paintOf(
    skills.getByRole('link', {
      name: cell('store-pattern, 2026-10-03: no scored trials'),
    }),
  );
  const flaky = skills.getByRole('link', {
    name: cell('react-19, 2026-10-13: 78% (7/9), flaky'),
  });
  const failing = await paintOf(
    page
      .getByRole('figure', {
        exact: true,
        name: 'skill-quality: 2 subjects over 5 runs',
      })
      .getByRole('link', { name: cell('react-19, 2026-10-16: 0% (0/1)') }),
  );

  const amber = await paintOf(flaky);

  expect(new Set([amber, high, low, none]).size).toBe(4);
  expect(failing).toBe(low);
  await expect(
    skills.getByRole('link', {
      name: /^react-19, .*, flaky; open trial \d+$/u,
    }),
  ).toHaveCount(6);
  await expect(
    skills.getByRole('link', { name: /^store-pattern, .*, flaky; / }),
  ).toHaveCount(0);
});

it('renders the heatmap in light and dark', async ({ page }, testInfo) => {
  await captureThemes({
    name: 'heatmap',
    page,
    path: '/evals/heatmap',
    testInfo,
  });
});
