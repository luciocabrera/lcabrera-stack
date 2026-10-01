import type { Locator, Page } from '@playwright/test';

import { expect } from '@playwright/test';

const GRID = 'table';

export const grid = (page: Page) => page.getByTestId(GRID);

export const scrollContainer = (page: Page) =>
  page.getByTestId('table-scroll-container');

export const openGrid = async (page: Page, path = '/enterprise-orders') => {
  await page.goto(path);
  await expect(page).not.toHaveURL(/\/login/);
  const table = grid(page);
  await expect(table).toBeVisible();
  await expect(table).not.toHaveAttribute('aria-rowcount', '-1');
  return table;
};

export const expectDatasetCount = async (page: Page, count: number) => {
  await expect(grid(page)).toHaveAttribute('aria-rowcount', String(count + 1), {
    timeout: 60_000,
  });
};

export const readRowCount = async (page: Page) => {
  const value = await grid(page).getAttribute('aria-rowcount');

  if (value === null) {
    throw new Error('grid has no aria-rowcount');
  }

  return Number(value);
};

export const bodyCells = (page: Page, columnKey: string) =>
  page.locator(
    `[data-testid="table-body-cell"][data-column-key="${columnKey}"]`,
  );

export const firstBodyCell = (page: Page, columnKey: string) =>
  bodyCells(page, columnKey).first();

export const headerLabels = (page: Page) =>
  page.getByTestId('table-header-label').allTextContents();

export const columnHeader = (page: Page, label: string) =>
  page.getByRole('columnheader').filter({
    has: page
      .getByTestId('table-header-label')
      .getByText(label, { exact: true }),
  });

export const openColumnMenu = async (page: Page, label: string) => {
  await page
    .getByRole('button', { exact: true, name: `${label} column actions` })
    .click();
};

export const clickMenuAction = async (page: Page, name: string) => {
  await page.getByRole('button', { exact: true, name }).click();
};

export const visiblePanel = (page: Page) =>
  page.locator('[role="tabpanel"]:visible');

export const openSettings = async (page: Page) => {
  const trigger = page.getByRole('button', { name: 'Table settings' });
  const filters = page.getByRole('tab', { exact: true, name: 'Filters' });

  await expect(async () => {
    if (!(await filters.isVisible())) {
      await trigger.click();
    }

    await expect(filters).toBeVisible();
  }).toPass();
};

export const selectTab = async (page: Page, name: string) => {
  await page.getByRole('tab', { exact: true, name }).click();
};

export const acceptSettings = async (page: Page) => {
  await page.getByRole('button', { exact: true, name: 'Accept' }).click();
  await expect(page.getByTestId('side-panel-title')).toBeHidden();
};

export const cancelSettings = async (page: Page) => {
  await page.getByRole('button', { exact: true, name: 'Cancel' }).click();
  await expect(page.getByTestId('side-panel-title')).toBeHidden();
};

export const columnRow = (page: Page, label: string) =>
  visiblePanel(page)
    .getByRole('listitem')
    .filter({ has: page.getByText(label, { exact: true }) });

export const scrollHorizontally = async (page: Page, edge: 'end' | 'start') => {
  await scrollContainer(page).evaluate((element, target) => {
    element.scrollLeft = target === 'end' ? element.scrollWidth : 0;
  }, edge);
};

export const scrollToEnd = async (page: Page) => {
  await scrollContainer(page).evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
};

export const reorderColumns = async (
  page: Page,
  fromLabel: string,
  toLabel: string,
) => {
  const from = columnRow(page, fromLabel);
  const to = columnRow(page, toLabel);
  await from.dispatchEvent('dragstart');
  await to.dispatchEvent('dragenter');
  await from.dispatchEvent('dragend');
};

export const boxOf = async (locator: Locator, label: string) => {
  const box = await locator.boundingBox();

  if (box === null) {
    throw new Error(`Missing box for ${label}`);
  }

  return box;
};
