import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  cellsOf,
  expectLink,
  expectRightAligned,
  mainOf,
  openEvals,
  paintOf,
  rowOf,
} from './evalsPage';
import { SEED_RUNS } from './seedStory';

const run = (runId: string) => `/evals/runs/${runId}`;

it('explains the scores and the bands', async ({ page }) => {
  await openEvals(page, '/evals/quality');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Quality dimensions',
  );
  await expect(mainOf(page)).toContainText(
    "The judge's mean score per rubric dimension, from 1 to 5, in each of the last 5 skill-quality runs, oldest first. A dimension's baseline band is its mean ± 2 standard deviations over the runs of the skill's latest quality baseline; a red point fell below it, a green one did not, and a grey one has no band to judge against.",
  );
});

it('gives each skill a section headed by a link to the skill, with its baseline note', async ({
  page,
}) => {
  await openEvals(page, '/evals/quality');

  for (const name of ['react-19', 'unslop']) {
    const heading = mainOf(page).getByRole('heading', { exact: true, name });

    await expect(heading).toBeVisible();
    await expectLink({
      href: `/evals/subjects/skill/${name}`,
      name,
      scope: heading,
    });
  }

  await expect(mainOf(page)).toContainText(
    'Baseline of 3 runs on claude-opus-5-5.',
  );
  await expect(mainOf(page)).toContainText(
    'No quality baseline is recorded for this skill.',
  );
  await expect(mainOf(page)).not.toContainText(
    'No skill-quality run is stored yet.',
  );
});

it('lists each dimension with its latest score and baseline band', async ({
  page,
}) => {
  await openEvals(page, '/evals/quality');

  for (const name of ['Dimension', 'Latest', 'Baseline band']) {
    await expect(
      page.getByRole('columnheader', { exact: true, name }),
    ).toHaveCount(2);
  }

  const description = rowOf(
    page,
    'description 2.00 3.18 to 5.49 react-19 description over its last 5 scored runs',
  );

  await expect(description).toBeVisible();
  await expect(
    rowOf(
      page,
      'examples 4.00 none react-19 examples over its last 2 scored runs',
    ),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'description 3.00 none unslop description over its last 5 scored runs',
    ),
  ).toBeVisible();
  await expectRightAligned(cellsOf(description).nth(1));
  await expectRightAligned(cellsOf(description).nth(2));
});

it('draws a sparkline per dimension with red, green and grey points that open their runs', async ({
  page,
}) => {
  await openEvals(page, '/evals/quality');

  const description = page.getByRole('figure', {
    exact: true,
    name: 'react-19 description over its last 5 scored runs',
  });
  const examples = page.getByRole('figure', {
    exact: true,
    name: 'react-19 examples over its last 2 scored runs',
  });
  const below = description.getByRole('link', {
    exact: true,
    name: 'Run a5000000, 2026-10-16: 2.00 over 1 trials',
  });
  const within = description.getByRole('link', {
    exact: true,
    name: 'Run a4000000, 2026-10-15: 4.00 over 1 trials',
  });
  const unbanded = examples.getByRole('link', {
    exact: true,
    name: 'Run a4000000, 2026-10-15: 3.00 over 1 trials',
  });

  await expect(description.getByRole('link')).toHaveCount(5);
  await expect(examples.getByRole('link')).toHaveCount(2);
  await expect(below).toHaveAttribute('href', run(SEED_RUNS.qualityLatest));
  await expect(within).toHaveAttribute('href', run(SEED_RUNS.qualityPrevious));
  await expect(unbanded).toHaveAttribute(
    'href',
    run(SEED_RUNS.qualityPrevious),
  );

  const tones = await Promise.all(
    [below, within, unbanded].map((point) => paintOf(point)),
  );

  expect(new Set(tones).size).toBe(3);
  expect(
    await paintOf(
      description.getByRole('link', {
        name: 'Run a1000000, 2026-10-07: 4.00 over 1 trials',
      }),
    ),
  ).toBe(tones[1]);
  expect(
    await paintOf(
      page
        .getByRole('figure', {
          exact: true,
          name: 'unslop description over its last 5 scored runs',
        })
        .getByRole('link', {
          name: 'Run a5000000, 2026-10-16: 3.00 over 1 trials',
        }),
    ),
  ).toBe(tones[2]);
});

it('renders the quality page in light and dark', async ({ page }, testInfo) => {
  await captureThemes({
    name: 'quality',
    page,
    path: '/evals/quality',
    testInfo,
  });
});
