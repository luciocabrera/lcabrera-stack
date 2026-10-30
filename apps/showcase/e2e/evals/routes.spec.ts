import { expect, test as it } from '@playwright/test';

import { headerLabels, openGrid, readRowCount } from '../grid';
import { expectRouteErrorBoundary, mainOf } from './evalsPage';
import { SEED_RUNS } from './seedStory';

const UNKNOWN_RUN = '99000000-0000-4000-8000-000000000009';

const NOT_FOUND = [
  [
    `/evals/runs/${UNKNOWN_RUN}`,
    'Failed to load the eval run. Please try again.',
  ],
  [
    '/evals/compare?a=not-a-run&b=not-a-run',
    'Failed to compare the eval runs. Please try again.',
  ],
  [
    `/evals/confusion?run=${SEED_RUNS.verifier}`,
    'Failed to load the trigger confusion matrix. Please try again.',
  ],
  [
    '/evals/subjects/skill/no-such-skill',
    'Failed to load the subject trend. Please try again.',
  ],
] as const;

for (const [path, message] of NOT_FOUND) {
  it(`catches a missing record in the route's own error boundary at ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await expectRouteErrorBoundary({
      message: mainOf(page).getByText(message, { exact: true }),
      page,
    });
  });
}

it('serves a run as JSON at runs/:runId.json', async ({ request }) => {
  const response = await request.get(
    `/evals/runs/${SEED_RUNS.skillsLatest}.json`,
  );

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  expect(await response.json()).toMatchObject({
    run: {
      branch: 'main',
      model_id: 'claude-opus-5-5',
      run_id: SEED_RUNS.skillsLatest,
      started_at: '2026-10-13T02:00:00.000Z',
      status: 'complete',
      suite: 'skills',
      trigger: 'ci-scheduled',
    },
  });
});

it('serves a page of trials at runs/:runId/trials', async ({ request }) => {
  const response = await request.get(
    `/evals/runs/${SEED_RUNS.skillsLatest}/trials?limit=2&skip=1`,
  );

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    data: [
      {
        durationMs: 15_000,
        outcome: 'pass',
        taskKey: 'skills/react-19/trigger-1',
        trialIndex: 1,
      },
      {
        durationMs: 22_000,
        outcome: 'pass',
        taskKey: 'skills/react-19/trigger-1',
        trialIndex: 2,
      },
    ],
    total: 15,
  });
});

it('answers 404 for the trials of an id that is not a run', async ({
  request,
}) => {
  const response = await request.get('/evals/runs/not-a-run/trials');

  expect(response.status()).toBe(404);
});

it('leaves /skill-scores as it is', async ({ page }) => {
  await openGrid(page, '/skill-scores');

  await expect(
    mainOf(page).getByRole('heading', { exact: true, name: 'Every skill' }),
  ).toBeVisible();
  await expect
    .poll(() => headerLabels(page))
    .toEqual([
      'Skill',
      'Clarity',
      'Completeness',
      'Trigger Precision',
      'Scope Coverage',
      'Anti Patterns',
      'Overall',
      'Change',
    ]);
  await expect.poll(() => readRowCount(page)).toBeGreaterThan(1);
});
