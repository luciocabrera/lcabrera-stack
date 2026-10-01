import { expect, test as it } from '@playwright/test';

import {
  acceptSettings,
  bodyCells,
  cancelSettings,
  expectDatasetCount,
  firstBodyCell,
  openColumnMenu,
  openGrid,
  openSettings,
  readRowCount,
  selectTab,
} from './grid';
import { readOrderSample } from './oracle';
import {
  addColumn,
  chooseOperator,
  clickFilterBoolean,
  clickToolbar,
  fillFilterDate,
  fillFilterNumber,
  fillFilterText,
  filterItem,
  pickFilterOption,
} from './settings';

const STATUS = 'order_status';
const ORDER_NUMBER = 'order_number';
const QUANTITY = 'quantity';
const ORDER_DATE = 'order_date';
const GIFT = 'is_gift';
const PRIORITY = 'priority';

const apply = async (page: Parameters<typeof openGrid>[0], count: number) => {
  await acceptSettings(page);
  await expectDatasetCount(page, count);
};

it('filters status to the rows the database counts as Delivered', async ({
  page,
}) => {
  const sample = await readOrderSample({
    filters: [{ type: 'statusEquals', value: 'Delivered' }],
  });

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Status');
  await pickFilterOption(filterItem(page, STATUS), 'Delivered');
  await apply(page, sample.count);

  const statuses = await bodyCells(page, STATUS).allTextContents();
  expect(statuses.length).toBeGreaterThan(0);
  expect(statuses.every((status) => status.trim() === 'Delivered')).toBe(true);
});

it('filters an order number by the prefix the database matches', async ({
  page,
}) => {
  const sample = await readOrderSample({
    filters: [{ prefix: 'ORD-0000001', type: 'orderNumberStartsWith' }],
  });

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Order #');
  await chooseOperator(filterItem(page, ORDER_NUMBER), 'Starts with');
  await fillFilterText(filterItem(page, ORDER_NUMBER), 'ORD-0000001');
  await apply(page, sample.count);
  await expect(firstBodyCell(page, ORDER_NUMBER)).toHaveText(/^ORD-0000001/);
});

it('filters quantity above the middle of the generated range', async ({
  page,
}) => {
  const sample = await readOrderSample({
    filters: [{ type: 'quantityGreaterThan', value: 10 }],
  });

  if (sample.orderNumber === undefined) {
    throw new Error('quantity filter matched no row');
  }

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Quantity');
  await chooseOperator(filterItem(page, QUANTITY), 'Greater than');
  await fillFilterNumber(filterItem(page, QUANTITY), '10');
  await apply(page, sample.count);
  await expect(firstBodyCell(page, ORDER_NUMBER)).toHaveText(
    sample.orderNumber,
  );
});

it('filters order dates after 2023-01-01', async ({ page }) => {
  const sample = await readOrderSample({
    filters: [{ type: 'orderDateAfter', value: '2023-01-01' }],
    sort: 'orderIdAsc',
  });

  if (sample.orderNumber === undefined) {
    throw new Error('date filter matched no row');
  }

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Order Date');
  await chooseOperator(filterItem(page, ORDER_DATE), 'After');
  await fillFilterDate(filterItem(page, ORDER_DATE), '2023-01-01');
  await apply(page, sample.count);
  await expect(firstBodyCell(page, ORDER_NUMBER)).toHaveText(
    sample.orderNumber,
  );
});

it('filters gift rows to the checked state', async ({ page }) => {
  const sample = await readOrderSample({ filters: [{ type: 'gift' }] });

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Gift');
  await clickFilterBoolean(filterItem(page, GIFT), 'True');
  await apply(page, sample.count);
  await expect(
    page.getByRole('checkbox', { name: 'Gift: Yes' }).first(),
  ).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Gift: No' })).toHaveCount(0);
});

it('filters status and priority together', async ({ page }) => {
  const sample = await readOrderSample({
    filters: [
      { type: 'statusEquals', value: 'Delivered' },
      { type: 'priorityEquals', value: 'High' },
    ],
  });

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Status');
  await pickFilterOption(filterItem(page, STATUS), 'Delivered');
  await addColumn(page, 'Priority');
  await pickFilterOption(filterItem(page, PRIORITY), 'High');
  await apply(page, sample.count);
});

it('clearing a draft and cancelling leaves the grid alone', async ({
  page,
}) => {
  const sample = await readOrderSample();

  await openGrid(page);
  await expectDatasetCount(page, sample.count);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Status');
  await pickFilterOption(filterItem(page, STATUS), 'Delivered');
  await clickToolbar(page, 'Clear Filters');
  await expect(filterItem(page, STATUS)).toHaveCount(0);
  await cancelSettings(page);
  await expectDatasetCount(page, sample.count);
});

it('clearing a live filter and accepting restores the full count', async ({
  page,
}) => {
  const full = await readOrderSample();
  const delivered = await readOrderSample({
    filters: [{ type: 'statusEquals', value: 'Delivered' }],
  });

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Status');
  await pickFilterOption(filterItem(page, STATUS), 'Delivered');
  await apply(page, delivered.count);

  await openSettings(page);
  await selectTab(page, 'Filters');
  await clickToolbar(page, 'Clear Filters');
  await apply(page, full.count);
});

it('reset restores the live filter into the draft', async ({ page }) => {
  const delivered = await readOrderSample({
    filters: [{ type: 'statusEquals', value: 'Delivered' }],
  });

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Status');
  await pickFilterOption(filterItem(page, STATUS), 'Delivered');
  await apply(page, delivered.count);

  await openSettings(page);
  await selectTab(page, 'Filters');
  await clickToolbar(page, 'Clear Filters');
  await expect(filterItem(page, STATUS)).toHaveCount(0);
  await clickToolbar(page, 'Reset Filters');
  await expect(filterItem(page, STATUS)).toBeVisible();
  await apply(page, delivered.count);
});

it('a reload keeps the accepted filter and a new context does not', async ({
  browser,
  page,
}) => {
  const full = await readOrderSample();
  const delivered = await readOrderSample({
    filters: [{ type: 'statusEquals', value: 'Delivered' }],
  });

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Status');
  await pickFilterOption(filterItem(page, STATUS), 'Delivered');
  await apply(page, delivered.count);

  await page.reload();
  await expectDatasetCount(page, delivered.count);

  const context = await browser.newContext();
  const fresh = await context.newPage();
  await openGrid(fresh);
  await expectDatasetCount(fresh, full.count);
  await context.close();
});

it('an empty text filter blocks accept', async ({ page }) => {
  const sample = await readOrderSample();

  await openGrid(page);
  await expectDatasetCount(page, sample.count);
  const before = await readRowCount(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Order #');
  await page.getByRole('button', { exact: true, name: 'Accept' }).click();
  await expect(
    page.getByText('Invalid filters', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Fix invalid filters before accepting table settings.'),
  ).toBeVisible();
  await expect(page.getByTestId('side-panel-title')).toBeVisible();
  expect(await readRowCount(page)).toBe(before);
});

it('a prefix no generated order number uses shows the empty notice', async ({
  page,
}) => {
  const sample = await readOrderSample({
    filters: [{ prefix: 'ZZZ', type: 'orderNumberStartsWith' }],
  });
  expect(sample.count).toBe(0);

  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Order #');
  await chooseOperator(filterItem(page, ORDER_NUMBER), 'Starts with');
  await fillFilterText(filterItem(page, ORDER_NUMBER), 'ZZZ');
  await apply(page, 0);
  await expect(
    page.getByText(/No records match the current view/),
  ).toBeVisible();
});

it('manage column opens that column and closes the table settings', async ({
  page,
}) => {
  await openGrid(page);
  await openColumnMenu(page, 'Status');
  await page
    .getByRole('button', { exact: true, name: 'Manage Column' })
    .click();
  await expect(page.getByTestId('side-panel-title')).toHaveText('Status');
});
