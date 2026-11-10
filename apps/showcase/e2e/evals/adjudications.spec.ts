import type { Page } from '@playwright/test';

import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  cellsOf,
  expectFacts,
  expectLink,
  mainOf,
  openEvals,
} from './evalsPage';

const PATH = '/evals/adjudications';

const GRID_RULE = 'lint/a11y/noNoninteractiveElementToInteractiveRole';

const rowsOf = async (page: Page, name: string) => {
  const rows = mainOf(page)
    .getByRole('table', { exact: true, name })
    .getByRole('row');
  const count = await rows.count();

  return Promise.all(
    Array.from({ length: count - 1 }, (_, index) =>
      cellsOf(rows.nth(index + 1)).allInnerTexts(),
    ),
  );
};

it('names the page, links back to the overview and counts the history', async ({
  page,
}) => {
  await openEvals(page, PATH);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'False-positive panel',
  );
  await expectLink({
    href: '/evals',
    name: 'Evals',
    scope: page.getByRole('navigation', { name: 'Breadcrumb' }),
  });
  await expectFacts(page, [
    ['Cases', '4'],
    ['With a true answer', '3'],
    ['Dismissed', '2'],
    ['Reopened dismissals', '1'],
    ['Only the adversary said REAL', '1'],
    ['Of those, REAL by the true answer', '1'],
  ]);
  await expect(mainOf(page).getByRole('heading', { level: 2 })).toHaveText([
    'Cases',
    'Reopened dismissals',
    'Accuracy by model and role',
    'Accuracy by model and rule',
    'Accuracy by prompt',
    'False positives by rule',
    'Cost and time by model',
    'Cases by builder model',
  ]);
});

it('lists every case newest first with its panel, true answer, cost and time', async ({
  page,
}) => {
  await openEvals(page, PATH);

  const rows = await rowsOf(page, 'False-positive panel cases, newest first');

  expect(rows.map(([caseId]) => caseId)).toEqual([
    'FP-0104',
    'FP-0103',
    'FP-0102',
    'FP-0101',
  ]);
  expect(rows[0]).toEqual([
    'FP-0104',
    '2026-10-26',
    'oxlint',
    'unicorn/no-nested-ternary',
    '#1605',
    'fixed',
    '3 REAL',
    'none yet',
    '$1.41',
    '1m 30s',
    'claude-sonnet-5-5',
  ]);
  expect(rows[2]).toEqual([
    'FP-0102',
    '2026-10-22',
    'fallow',
    'complexity',
    '',
    'split',
    '2 FALSE_POSITIVE, 1 REAL',
    'REAL (lucio)',
    '$1.41',
    '1m 30s',
    'not recorded',
  ]);
  await expect(mainOf(page).getByRole('listitem')).toContainText([
    `FP-0103: biome ${GRID_RULE}, dismissed by the panel on 2026-10-24, then reopened as REAL`,
  ]);
});

it('scores each model and role against the true answer, over time and by rule', async ({
  page,
}) => {
  await openEvals(page, PATH);

  expect(
    await rowsOf(
      page,
      'Verdicts scored against the latest true answer, by model and role',
    ),
  ).toEqual([
    [
      'claude-fable-5-1',
      'adversary',
      '3',
      '2',
      '67% (2/3)',
      'too few verdicts for an interval',
      '1',
      '0',
    ],
    [
      'claude-opus-5-5',
      'judge',
      '3',
      '1',
      '33% (1/3)',
      'too few verdicts for an interval',
      '2',
      '0',
    ],
    [
      'claude-sonnet-5-5',
      'judge',
      '3',
      '1',
      '33% (1/3)',
      'too few verdicts for an interval',
      '2',
      '0',
    ],
  ]);
  await expect(
    mainOf(page).getByRole('figure', {
      exact: true,
      name: 'Accuracy of each model over the cases it sat on, in the order they opened',
    }),
  ).toBeVisible();
  await expect(
    mainOf(page).getByRole('figure', {
      exact: true,
      name: 'Accuracy of 3 models over 2 rules',
    }),
  ).toBeVisible();
  expect(
    await rowsOf(page, 'Verdicts by role and prompt hash, oldest prompt first'),
  ).toEqual([
    [
      'adversary',
      expect.stringMatching(/^[0-9a-f]{12}$/u),
      '2026-10-20',
      '4',
      '67% (2/3)',
    ],
    [
      'judge',
      expect.stringMatching(/^[0-9a-f]{12}$/u),
      '2026-10-20',
      '8',
      '33% (2/6)',
    ],
  ]);
});

it('counts false positives per rule, cost per model and cases per builder', async ({
  page,
}) => {
  await openEvals(page, PATH);

  expect(
    await rowsOf(
      page,
      'Cases by analyzer and rule, with the share the true answer called a false positive',
    ),
  ).toEqual([
    ['biome', GRID_RULE, '2', '2', '2', '1', '50% (1/2)', '1'],
    ['fallow', 'complexity', '1', '0', '1', '0', '0% (0/1)', '0'],
    [
      'oxlint',
      'unicorn/no-nested-ternary',
      '1',
      '0',
      '0',
      '0',
      'no true answer yet',
      '0',
    ],
  ]);
  const [fable] = await rowsOf(
    page,
    'Reported cost, time and tokens of each model on the panel',
  );

  expect(fable).toEqual([
    'claude-fable-5-1',
    '4',
    '4',
    '$4.32',
    '$1.08',
    '1m 30s',
    '4,000',
    '8,000',
  ]);
  expect(
    await rowsOf(
      page,
      'Cases by the model that built the change, with the panel accuracy on them',
    ),
  ).toEqual([
    ['claude-opus-5-5', '2', '2', '50% (3/6)'],
    ['claude-sonnet-5-5', '1', '0', 'no true answer yet'],
    ['not recorded', '1', '0', '33% (1/3)'],
  ]);
});

it('renders the page in light and dark', async ({ page }, testInfo) => {
  await captureThemes({ name: 'adjudications', page, path: PATH, testInfo });
});
