import { expect, test as it } from '@playwright/test';

import { captureThemes, mainOf, openEvals } from './evalsPage';

it('says no run is stored yet on the overview, and draws no card or alert', async ({
  page,
}) => {
  await openEvals(page, '/evals');

  await expect(mainOf(page)).toContainText('No eval runs are stored yet.');
  await expect(mainOf(page).getByRole('alert')).toHaveCount(0);
  await expect(mainOf(page).getByRole('heading', { level: 2 })).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Eval views' }).getByRole('link'),
  ).toHaveCount(7);
});

it('says no skill-quality run is stored yet on the quality page', async ({
  page,
}) => {
  await openEvals(page, '/evals/quality');

  await expect(mainOf(page)).toContainText(
    'No skill-quality run is stored yet.',
  );
  await expect(mainOf(page)).toContainText(
    'in each of the last 0 skill-quality runs',
  );
});

it('offers no run to compare on an empty history', async ({ page }) => {
  await openEvals(page, '/evals/compare');

  await expect(
    page.getByRole('combobox', { name: 'Run A' }).getByRole('option'),
  ).toHaveCount(0);
});

for (const path of ['/evals/flaky', '/evals/health', '/evals/heatmap']) {
  it(`says no run is stored yet at ${path}`, async ({ page }) => {
    await openEvals(page, path);

    await expect(mainOf(page)).toContainText('No eval runs are stored yet.');
  });
}

it('says the empty recent window holds no trigger trial on the confusion page', async ({
  page,
}) => {
  await openEvals(page, '/evals/confusion');

  await expect(mainOf(page)).toContainText(
    'No trigger or near-miss trial is stored for the last 0 skills runs.',
  );
});

it('renders the empty overview and quality page in light and dark', async ({
  page,
}, testInfo) => {
  await captureThemes({
    name: 'overview-empty',
    page,
    path: '/evals',
    testInfo,
  });
  await captureThemes({
    name: 'quality-empty',
    page,
    path: '/evals/quality',
    testInfo,
  });
});
