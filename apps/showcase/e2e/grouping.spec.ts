import { expect, test as it } from '@playwright/test';

import {
  acceptSettings,
  bodyCells,
  clickMenuAction,
  columnRow,
  expectDatasetCount,
  grid,
  openColumnMenu,
  openGrid,
  openSettings,
  selectTab,
} from './grid';
import { readOrderSample } from './oracle';
import { addAggregate, addColumnIn, clickToolbar } from './settings';

it.describe.configure({ timeout: 180_000 });

const groupByStatus = async (page: Parameters<typeof openGrid>[0]) => {
  await openColumnMenu(page, 'Status');
  await clickMenuAction(page, 'Group by This');
  await expect(grid(page)).toHaveAttribute('role', 'treegrid', {
    timeout: 90_000,
  });
  await expect(
    page.getByTestId('table-group-header-row').first(),
  ).toBeVisible();
};

it('grouping by status opens the group from its details link', async ({
  page,
}) => {
  await openGrid(page);
  await groupByStatus(page);
  await expect(page.getByRole('columnheader', { name: /Actions/ })).toHaveCount(
    0,
  );
  await expect(
    page
      .getByTestId('table-group-key-cell')
      .filter({ hasText: /Cancelled|Delivered|Pending|Processing|Shipped/ })
      .first(),
  ).toBeVisible();

  await page.getByTestId('table-group-details-link').first().click();
  await expect(page).toHaveURL(/\/enterprise-orders\/group/);
  await expect(grid(page)).toBeVisible();
});

it('a second group key and a sum both land on the group rows', async ({
  page,
}) => {
  await openGrid(page);
  await groupByStatus(page);

  await openSettings(page);
  await selectTab(page, 'Grouping');
  await addColumnIn(page, 'Add Group Key', 'Priority');
  await page.getByRole('tab', { exact: true, name: 'Aggregates' }).click();
  await addAggregate(page, 'Total Amount', 'Sum');
  await acceptSettings(page);

  await expect(grid(page)).toHaveAttribute('role', 'treegrid');
  await expect(
    page
      .getByTestId('table-group-key-cell')
      .filter({ hasText: /Critical|High|Low|Normal|Urgent/ })
      .first(),
  ).toBeVisible();
  const sumCell = page
    .getByTestId('table-group-header-row')
    .first()
    .locator(
      '[data-testid="table-body-cell"][data-column-key="total_amount:sum"]',
    );
  await expect(sumCell).toBeVisible();
  await expect(sumCell).toContainText(/\d/);

  await openSettings(page);
  await selectTab(page, 'Grouping');
  await page.getByRole('tab', { exact: true, name: 'Aggregates' }).click();
  await clickToolbar(page, 'Clear Aggregates');
  await acceptSettings(page);
  await expect(
    page.locator('[data-column-key="total_amount:sum"]'),
  ).toHaveCount(0);
});

it('clear grouping from the header returns the flat grid', async ({ page }) => {
  const sample = await readOrderSample();

  await openGrid(page);
  await groupByStatus(page);
  await openColumnMenu(page, 'Status');
  await clickMenuAction(page, 'Clear Grouping');
  await expect(grid(page)).toHaveAttribute('role', 'grid', { timeout: 90_000 });
  await expectDatasetCount(page, sample.count);
  await expect(bodyCells(page, 'order_number').first()).toBeVisible();
});

it('the drawer can clear grouping too', async ({ page }) => {
  const sample = await readOrderSample();

  await openGrid(page);
  await groupByStatus(page);
  await openSettings(page);
  await selectTab(page, 'Grouping');
  await clickToolbar(page, 'Clear Grouping');
  await acceptSettings(page);
  await expect(grid(page)).toHaveAttribute('role', 'grid', { timeout: 90_000 });
  await expectDatasetCount(page, sample.count);
});

it('a reload keeps the group and a grouped column cannot be pinned or hidden', async ({
  browser,
  page,
}) => {
  await openGrid(page);
  await groupByStatus(page);
  await page.reload();
  await expect(grid(page)).toHaveAttribute('role', 'treegrid', {
    timeout: 90_000,
  });

  await openColumnMenu(page, 'Status');
  await expect(
    page.getByRole('button', { exact: true, name: 'Pin Left' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { exact: true, name: 'Hide Column' }),
  ).toBeDisabled();

  await openSettings(page);
  await selectTab(page, 'Columns');
  const status = columnRow(page, 'Status');
  await expect(status.getByRole('switch', { name: 'Pin' })).toBeDisabled();
  await expect(status.getByRole('switch', { name: 'Show' })).toBeDisabled();

  const context = await browser.newContext();
  const fresh = await context.newPage();
  await openGrid(fresh);
  await expect(grid(fresh)).toHaveAttribute('role', 'grid');
  await context.close();
});
