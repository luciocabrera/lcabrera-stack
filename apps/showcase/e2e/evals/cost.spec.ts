import { expect, test as it } from '@playwright/test';

import {
  captureThemes,
  cellsOf,
  expectLink,
  expectRightAligned,
  expectTrialHref,
  mainOf,
  openEvals,
  rowOf,
} from './evalsPage';
import { SEED_RUNS } from './seedStory';

const COLUMNS = [
  'Name',
  'Trials',
  'Tokens in',
  'Tokens out',
  'Cache tokens',
  'Reported by the SDK',
  'Computed from model prices',
  'p50 duration',
  'p95 duration',
];

const SUITES = [
  'rules-consistency',
  'skill-quality',
  'skills',
  'verifier-fixtures',
];

const CHARTS = [
  'cost per run, reported by the sdk',
  'cost per run, computed from model prices',
  'p95 duration per run',
];

it('draws three sparklines per suite card', async ({ page }) => {
  await openEvals(page, '/evals/cost');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Cost and latency',
  );

  for (const suite of SUITES) {
    await expect(
      mainOf(page).getByRole('heading', { exact: true, name: suite }),
    ).toBeVisible();

    for (const chart of CHARTS) {
      await expect(
        page.getByRole('figure', { exact: true, name: `${suite}: ${chart}` }),
      ).toBeVisible();
    }
  }

  const reported = page.getByRole('figure', {
    exact: true,
    name: 'skills: cost per run, reported by the sdk',
  });
  const computed = page.getByRole('figure', {
    exact: true,
    name: 'skills: cost per run, computed from model prices',
  });
  const slowest = page.getByRole('figure', {
    exact: true,
    name: 'skills: p95 duration per run',
  });

  await expect(reported.getByRole('link')).toHaveCount(6);
  await expect(computed.getByRole('link')).toHaveCount(4);
  await expect(slowest.getByRole('link')).toHaveCount(6);
  await expectTrialHref({
    runId: SEED_RUNS.skillsLatest,
    target: reported.getByRole('link', {
      name: /^Run 54000000, 2026-10-13: \$1\.80 reported by the SDK; open the costliest trial, \d+$/u,
    }),
  });
  await expect(
    computed.getByRole('link', {
      name: /^Run 54000000, 2026-10-13: \$0\.1218 computed from model prices; open the costliest trial, \d+$/u,
    }),
  ).toBeVisible();
  await expectTrialHref({
    runId: SEED_RUNS.skillsLatest,
    target: slowest.getByRole('link', {
      name: /^Run 54000000, 2026-10-13: p95 29s; open the slowest trial, \d+$/u,
    }),
  });
  await expect(
    page
      .getByRole('figure', {
        exact: true,
        name: 'rules-consistency: cost per run, reported by the sdk',
      })
      .getByRole('link'),
  ).toHaveCount(0);
});

it('tabulates per suite, per subject and per run in the same nine columns', async ({
  page,
}) => {
  await openEvals(page, '/evals/cost');

  for (const name of COLUMNS) {
    await expect(
      page.getByRole('columnheader', { exact: true, name }),
    ).toHaveCount(3);
  }

  await expect(
    rowOf(
      page,
      'rules-consistency 3 3,000 600 300 read, 60 written not reported $0.0244 15s 21s',
    ),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'skill-quality 10 10,000 2,000 1,000 read, 200 written $1.20 $0.0812 19s 29s',
    ),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'skills 90 90,000 18,000 9,000 read, 1,800 written $10.80 $0.4872 (60 of 90 trials priced) 18s 30s',
    ),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'verifier-fixtures 510 510,000 102,000 51,000 read, 10,200 written $61.20 $4.1412 19s 29s',
    ),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'skill react-19 59 59,000 11,800 5,900 read, 1,180 written $7.08 $0.3329 (41 of 59 trials priced) 18s 29s',
    ),
  ).toBeVisible();
  await expect(
    rowOf(
      page,
      'rules-consistency, 2026-10-18 05:00, claude-opus-5-5 3 3,000 600 300 read, 60 written not reported $0.0244 15s 21s',
    ),
  ).toBeVisible();
});

it('links each subject and each run by name', async ({ page }) => {
  await openEvals(page, '/evals/cost');

  for (const [name, href] of [
    ['agent refactor-verifier', '/evals/subjects/agent/refactor-verifier'],
    ['rule typescript', '/evals/subjects/rule/typescript'],
    ['skill react-19', '/evals/subjects/skill/react-19'],
    ['skill store-pattern', '/evals/subjects/skill/store-pattern'],
    ['skill unslop', '/evals/subjects/skill/unslop'],
    [
      'rules-consistency, 2026-10-18 05:00, claude-opus-5-5',
      `/evals/runs/${SEED_RUNS.rules}`,
    ],
    [
      'skills, 2026-10-13 02:00, claude-opus-5-5',
      `/evals/runs/${SEED_RUNS.skillsLatest}`,
    ],
    [
      'skills, 2026-10-05 02:00, claude-sonnet-5',
      `/evals/runs/${SEED_RUNS.skillsFirst}`,
    ],
    [
      'verifier-fixtures, 2026-10-17 04:00, claude-opus-5-5',
      `/evals/runs/${SEED_RUNS.verifier}`,
    ],
  ] as const) {
    await expectLink({ href, name, scope: mainOf(page) });
  }

  await expect(
    mainOf(page).getByRole('link', { exact: true, name: 'skills' }),
  ).toHaveCount(0);
});

it('right-aligns every figure column', async ({ page }) => {
  await openEvals(page, '/evals/cost');

  const cells = cellsOf(
    rowOf(
      page,
      'verifier-fixtures 510 510,000 102,000 51,000 read, 10,200 written $61.20 $4.1412 19s 29s',
    ),
  );

  for (const index of [1, 2, 3, 4, 5, 6, 7, 8]) {
    await expectRightAligned(cells.nth(index));
  }
});

it('renders the cost page in light and dark', async ({ page }, testInfo) => {
  await captureThemes({ name: 'cost', page, path: '/evals/cost', testInfo });
});
