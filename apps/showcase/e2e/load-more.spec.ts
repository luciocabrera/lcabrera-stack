import type { Page, Response } from '@playwright/test';

import { expect, test as it } from '@playwright/test';

import {
  acceptSettings,
  bodyCells,
  clickMenuAction,
  expectDatasetCount,
  grid,
  openColumnMenu,
  openGrid,
  openSettings,
  readRowCount,
  scrollToEnd,
  selectTab,
} from './grid';
import { readOrderSample } from './oracle';
import {
  addColumn,
  chooseOperator,
  fillFilterText,
  pickFilterOption,
} from './settings';

const ENTERPRISE_PAGE = '/_api/enterprise-orders/paginated';
const CAR_SALES_PAGE = '/_api/car-sales/paginated';

const watch = (page: Page, fragment: string) => {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes(fragment)) {
      urls.push(request.url());
    }
  });
  return urls;
};

const nextPage = (page: Page, fragment: string) =>
  page.waitForResponse(
    (response) => response.url().includes(fragment) && response.ok(),
    { timeout: 60_000 },
  );

const readParams = (response: Response) => new URL(response.url()).searchParams;

const isSortedFollowUp = (url: string) => {
  const params = new URL(url).searchParams;
  const sort = params.get('sort') ?? '';

  return (
    sort.includes('quantity') &&
    sort.includes('desc') &&
    params.get('limit') === '150'
  );
};

it('the first paint does not ask for another page', async ({ page }) => {
  const hits = watch(page, ENTERPRISE_PAGE);
  await openGrid(page);
  expect(hits).toEqual([]);
});

it('scrolling asks for the next page with a cursor and keeps the dataset count', async ({
  page,
}) => {
  const sample = await readOrderSample();
  await openGrid(page);
  await expectDatasetCount(page, sample.count);
  const before = await readRowCount(page);
  const responsePromise = nextPage(page, ENTERPRISE_PAGE);

  await scrollToEnd(page);
  const params = readParams(await responsePromise);

  expect(params.get('limit')).toBe('150');
  expect(params.get('cursor')).toBeTruthy();
  await expect
    .poll(async () => {
      const ids = await bodyCells(page, 'order_id').allTextContents();
      return ids.some((id) => Number(id) > 50);
    })
    .toBe(true);
  expect(await readRowCount(page)).toBe(before);
});

it('a filtered follow-up page carries the filter', async ({ page }) => {
  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Status');
  await pickFilterOption(
    page.getByTestId('filter-item-order_status'),
    'Delivered',
  );
  await acceptSettings(page);

  const responsePromise = nextPage(page, ENTERPRISE_PAGE);
  await scrollToEnd(page);
  const filter = readParams(await responsePromise).get('filter') ?? '';
  expect(filter).toContain('order_status');
  expect(filter).toContain('Delivered');
});

it('a sorted follow-up page carries the sort', async ({ page }) => {
  const urls = watch(page, ENTERPRISE_PAGE);

  await openGrid(page);
  await openColumnMenu(page, 'Quantity');
  await clickMenuAction(page, 'Descending');
  await expect(
    page.getByRole('columnheader', { name: /Quantity/ }),
  ).toHaveAttribute('aria-sort', 'descending');
  await expect(grid(page)).not.toHaveAttribute('aria-rowcount', '-1');
  await scrollToEnd(page);
  await expect.poll(() => urls.some((url) => isSortedFollowUp(url))).toBe(true);
});

it('the single-slice route does not ask for another page when scrolled', async ({
  page,
}) => {
  const hits = watch(page, CAR_SALES_PAGE);
  await openGrid(page, '/car-sales');
  const pending = page.waitForRequest(
    (request) => request.url().includes(CAR_SALES_PAGE),
    { timeout: 2000 },
  );

  await scrollToEnd(page);

  let isArrived = true;

  try {
    await pending;
  } catch {
    isArrived = false;
  }

  expect(isArrived).toBe(false);
  expect(hits).toEqual([]);
});

it('the infinite route follow-up omits a browser filter', async ({ page }) => {
  const hits = watch(page, CAR_SALES_PAGE);
  await openGrid(page, '/car-sales-infinite');
  await openSettings(page);
  await selectTab(page, 'Filters');
  await addColumn(page, 'Model');
  await chooseOperator(page.getByTestId('filter-item-model'), 'Starts with');
  await fillFilterText(page.getByTestId('filter-item-model'), 'A');
  await acceptSettings(page);

  const responsePromise = nextPage(page, CAR_SALES_PAGE);
  await scrollToEnd(page);
  const params = readParams(await responsePromise);
  expect(params.has('filter')).toBe(false);
  expect(hits.every((url) => !new URL(url).searchParams.has('filter'))).toBe(
    true,
  );
});
