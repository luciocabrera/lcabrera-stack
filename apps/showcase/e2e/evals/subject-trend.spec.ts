import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  expectTrialHref,
  mainOf,
  openEvals,
  paintAt,
  paintOf,
} from './evalsPage';
import { SEED_RUNS } from './seedStory';

const PATH = '/evals/subjects/skill/react-19';

const MARKS = [
  'Content hash changed to 84f76e1dbb78',
  'Model changed from claude-sonnet-5 to claude-opus-5-5',
  'incident annotation, 2026-10-11',
];

it('gives each suite that records the subject its own section and pass-rate chart', async ({
  page,
}) => {
  await openEvals(page, PATH);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'skill react-19',
  );
  await expect(mainOf(page)).toContainText('Evals / skill trend');
  await expect(mainOf(page)).toContainText(
    'Pass rate per run, one chart for each suite that records this skill, with the Wilson interval as a band. Dashed lines mark a content-hash change, a model change or an annotation.',
  );

  for (const [suite, note] of [
    [
      'skill-quality',
      '5 scored runs of the last 5 skill-quality runs that record this skill.',
    ],
    [
      'skills',
      '5 scored runs of the last 6 skills runs that record this skill.',
    ],
  ] as const) {
    await expect(
      mainOf(page).getByRole('heading', { exact: true, name: suite }),
    ).toBeVisible();
    await expect(mainOf(page)).toContainText(note);
    await expect(
      page.getByRole('figure', {
        exact: true,
        name: `skill react-19 pass rate in ${suite} over time`,
      }),
    ).toBeVisible();
  }
});

it('links each dot to its run at one of its trials', async ({ page }) => {
  await openEvals(page, PATH);

  const skills = page.getByRole('figure', {
    exact: true,
    name: 'skill react-19 pass rate in skills over time',
  });

  await expect(skills.getByRole('link')).toHaveCount(5);

  for (const [name, runId] of [
    ['skills run 51000000, 2026-10-05: 89% (8/9)', SEED_RUNS.skillsFirst],
    ['skills run 52000000, 2026-10-10: 89% (8/9)', SEED_RUNS.skillsSecond],
    ['skills run 53000000, 2026-10-12: 100% (9/9)', SEED_RUNS.skillsPrevious],
    ['skills run 54000000, 2026-10-13: 78% (7/9)', SEED_RUNS.skillsLatest],
    ['skills run f1000000, 2026-10-14: 67% (6/9)', SEED_RUNS.featureSkills],
  ] as const) {
    await expectTrialHref({
      runId,
      target: skills.getByRole('link', { name: `${name}; open trial` }),
    });
  }

  await expect(
    page
      .getByRole('figure', {
        exact: true,
        name: 'skill react-19 pass rate in skill-quality over time',
      })
      .getByRole('link'),
  ).toHaveCount(5);
});

it('marks the content, model and annotation changes on the chart, each in its own tone', async ({
  page,
}) => {
  await openEvals(page, PATH);

  const skills = page.getByRole('figure', {
    exact: true,
    name: 'skill react-19 pass rate in skills over time',
  });
  const strokes = await Promise.all(
    MARKS.map((label) =>
      skills.getByText(label, { exact: true }).evaluate((title) => {
        const mark = title.parentElement;
        const style = mark === null ? undefined : getComputedStyle(mark);

        return {
          dashed: style?.strokeDasharray ?? 'none',
          stroke: style?.stroke ?? 'none',
        };
      }),
    ),
  );

  for (const { dashed } of strokes) {
    expect(dashed).not.toBe('none');
  }

  expect(new Set(strokes.map(({ stroke }) => stroke)).size).toBe(MARKS.length);
});

it('shades the Wilson band around the pass-rate line', async ({ page }) => {
  await openEvals(page, PATH);

  const skills = page.getByRole('figure', {
    exact: true,
    name: 'skill react-19 pass rate in skills over time',
  });
  const dot = skills.getByRole('link', { name: /^skills run 53000000, / });
  const band = await paintAt({ below: 12, target: dot });

  expect(band).not.toBe('none');
  expect(band).not.toBe(await paintOf(dot));
  expect(
    await paintAt({
      below: 12,
      target: skills.getByRole('link', { name: /^skills run 51000000, / }),
    }),
  ).toBe(band);
});

it('lists the marks, each linking to the run where it lands', async ({
  page,
}) => {
  await openEvals(page, PATH);

  const marks = mainOf(page)
    .getByRole('listitem')
    .filter({ hasText: /changed|annotation/u });

  await expect(marks).toHaveText([
    /^incident annotation, 2026-10-11: skill-quality run a4000000, 2026-10-15: 100% \(1\/1\); open trial \d+$/u,
    /^Content hash changed to 84f76e1dbb78: skills run 52000000, 2026-10-10: 89% \(8\/9\); open trial \d+$/u,
    /^Model changed from claude-sonnet-5 to claude-opus-5-5: skills run 52000000, 2026-10-10: 89% \(8\/9\); open trial \d+$/u,
    /^incident annotation, 2026-10-11: skills run 53000000, 2026-10-12: 100% \(9\/9\); open trial \d+$/u,
  ]);
  await expectTrialHref({
    runId: SEED_RUNS.qualityPrevious,
    target: marks.nth(0).getByRole('link'),
  });
  await expectTrialHref({
    runId: SEED_RUNS.skillsSecond,
    target: marks.nth(1).getByRole('link'),
  });
  await expectTrialHref({
    runId: SEED_RUNS.skillsSecond,
    target: marks.nth(2).getByRole('link'),
  });
  await expectTrialHref({
    runId: SEED_RUNS.skillsPrevious,
    target: marks.nth(3).getByRole('link'),
  });
});

it('renders the subject trend in light and dark', async ({
  page,
}, testInfo) => {
  await captureThemes({ name: 'subject-trend', page, path: PATH, testInfo });
});
