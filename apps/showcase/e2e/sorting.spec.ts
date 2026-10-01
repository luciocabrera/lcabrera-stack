import { expect, test as it } from '@playwright/test';

import {
  acceptSettings,
  cancelSettings,
  clickMenuAction,
  columnHeader,
  expectDatasetCount,
  firstBodyCell,
  openColumnMenu,
  openGrid,
  openSettings,
  selectTab,
} from './grid';
import { readOrderSample } from './oracle';
import { addColumn, clickToolbar } from './settings';

type GridPage = Parameters<typeof openGrid>[0];

const acceptQuantityAscending = async (page: GridPage) => {
  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Sorting');
  await addColumn(page, 'Quantity');
  await page.getByRole('button', { name: 'Sort Quantity ascending' }).click();
  await acceptSettings(page);
};

const expectFirstOrder = async (
  page: GridPage,
  orderNumber: string | undefined,
) => {
  if (orderNumber === undefined) {
    throw new Error('sort matched no row');
  }

  await expect(firstBodyCell(page, 'order_number')).toHaveText(orderNumber);
};

it('the header sorts a column up, down, and clear', async ({ page }) => {
  const ascending = await readOrderSample({ sort: 'orderIdAsc' });
  const byDate = await readOrderSample({ sort: 'orderDateDesc' });

  await openGrid(page);
  await expectFirstOrder(page, ascending.orderNumber);

  await openColumnMenu(page, 'Order Date');
  await clickMenuAction(page, 'Descending');
  await expect(columnHeader(page, 'Order Date')).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await expectFirstOrder(page, byDate.orderNumber);

  await openColumnMenu(page, 'Order Date');
  await clickMenuAction(page, 'Ascending');
  await expect(columnHeader(page, 'Order Date')).toHaveAttribute(
    'aria-sort',
    'ascending',
  );

  await openColumnMenu(page, 'Order Date');
  await clickMenuAction(page, 'Ascending');
  await expect(columnHeader(page, 'Order Date')).toHaveAttribute(
    'aria-sort',
    'none',
  );
  await expectFirstOrder(page, ascending.orderNumber);
});

it('header clear sorting drops the direction immediately', async ({ page }) => {
  const ascending = await readOrderSample({ sort: 'orderIdAsc' });
  const byQuantity = await readOrderSample({ sort: 'quantityDesc' });

  await openGrid(page);
  await openColumnMenu(page, 'Quantity');
  await clickMenuAction(page, 'Descending');
  await expectFirstOrder(page, byQuantity.orderNumber);

  await openColumnMenu(page, 'Quantity');
  await clickMenuAction(page, 'Clear Sorting');
  await expect(columnHeader(page, 'Quantity')).toHaveAttribute(
    'aria-sort',
    'none',
  );
  await expectFirstOrder(page, ascending.orderNumber);
});

it('the drawer sorts by two columns and keeps the primary-key tiebreaker', async ({
  page,
}) => {
  const sample = await readOrderSample({ sort: 'dateDescQuantityAsc' });
  const full = await readOrderSample();

  await openGrid(page);
  await expectDatasetCount(page, full.count);
  await openSettings(page);
  await selectTab(page, 'Sorting');
  await addColumn(page, 'Order Date');
  await page.getByRole('button', { name: 'Sort Order Date ascending' }).click();
  await addColumn(page, 'Quantity');
  await acceptSettings(page);
  await expectFirstOrder(page, sample.orderNumber);
  await expect(columnHeader(page, 'Order Date')).toHaveAttribute(
    'aria-sort',
    'descending',
  );
});

it('clearing a sort draft and cancelling keeps the live order', async ({
  page,
}) => {
  const sample = await readOrderSample({ sort: 'quantityDesc' });

  await acceptQuantityAscending(page);
  await expectFirstOrder(page, sample.orderNumber);

  await openSettings(page);
  await selectTab(page, 'Sorting');
  await clickToolbar(page, 'Clear Sorting');
  await cancelSettings(page);
  await expectFirstOrder(page, sample.orderNumber);
});

it('clearing a sort and accepting restores the default order', async ({
  page,
}) => {
  const sorted = await readOrderSample({ sort: 'quantityDesc' });
  const original = await readOrderSample();

  await acceptQuantityAscending(page);
  await expectFirstOrder(page, sorted.orderNumber);

  await openSettings(page);
  await selectTab(page, 'Sorting');
  await clickToolbar(page, 'Clear Sorting');
  await acceptSettings(page);
  await expectFirstOrder(page, original.orderNumber);
});

it('reset puts the live sort back into the draft', async ({ page }) => {
  const sample = await readOrderSample({ sort: 'quantityDesc' });

  await acceptQuantityAscending(page);

  await openSettings(page);
  await selectTab(page, 'Sorting');
  await clickToolbar(page, 'Clear Sorting');
  await clickToolbar(page, 'Reset Sorting');
  await expect(
    page.getByRole('button', { name: 'Sort Quantity descending' }),
  ).toBeVisible();
  await acceptSettings(page);
  await expectFirstOrder(page, sample.orderNumber);
});

it('a reload keeps the accepted sort', async ({ page }) => {
  const sample = await readOrderSample({ sort: 'quantityDesc' });

  await openGrid(page);
  await openColumnMenu(page, 'Quantity');
  await clickMenuAction(page, 'Descending');
  await expectFirstOrder(page, sample.orderNumber);
  await page.reload();
  await expect(columnHeader(page, 'Quantity')).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await expectFirstOrder(page, sample.orderNumber);
});
