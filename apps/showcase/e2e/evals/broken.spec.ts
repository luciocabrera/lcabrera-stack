import { test as it } from '@playwright/test';

import { expectRouteErrorBoundary, mainOf } from './evalsPage';

const PAGES = [
  ['/evals', 'Failed to load the eval runs. Please try again.'],
  ['/evals/compare', 'Failed to compare the eval runs. Please try again.'],
  [
    '/evals/quality',
    'Failed to load the quality dimension scores. Please try again.',
  ],
  ['/evals/flaky', 'Failed to load the flaky eval tasks. Please try again.'],
  ['/evals/cost', 'Failed to load the eval costs. Please try again.'],
  ['/evals/health', 'Failed to load the eval run health. Please try again.'],
  [
    '/evals/confusion',
    'Failed to load the trigger confusion matrix. Please try again.',
  ],
  ['/evals/heatmap', 'Failed to load the eval heatmap. Please try again.'],
  [
    '/evals/runs/54000000-0000-4000-8000-000000000004',
    'Failed to load the eval run. Please try again.',
  ],
  [
    '/evals/subjects/skill/react-19',
    'Failed to load the subject trend. Please try again.',
  ],
] as const;

for (const [path, message] of PAGES) {
  it(`catches an unreadable history in the route's own error boundary at ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await expectRouteErrorBoundary({
      message: mainOf(page)
        .getByText(message, { exact: true })
        .or(mainOf(page).getByText('eval_history_e2e_missing')),
      page,
    });
  });
}
