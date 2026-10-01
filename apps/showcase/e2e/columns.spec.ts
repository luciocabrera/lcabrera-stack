import { expect, test as it } from '@playwright/test';

import {
  acceptSettings,
  boxOf,
  columnHeader,
  columnRow,
  headerLabels,
  openColumnMenu,
  openGrid,
  openSettings,
  reorderColumns,
  scrollContainer,
  scrollHorizontally,
  selectTab,
} from './grid';

const indexOf = (labels: readonly string[], label: string) => {
  const index = labels.indexOf(label);

  if (index === -1) {
    throw new Error(`Header ${label} is not on the grid`);
  }

  return index;
};

it('dragging two unlocked columns swaps their header order after accept', async ({
  page,
}) => {
  await openGrid(page);
  const before = await headerLabels(page);
  const quantityBefore = indexOf(before, 'Quantity');
  const priorityBefore = indexOf(before, 'Priority');

  await openSettings(page);
  await selectTab(page, 'Columns');
  await reorderColumns(page, 'Quantity', 'Priority');
  await acceptSettings(page);

  const after = await headerLabels(page);
  expect(indexOf(after, 'Quantity')).not.toBe(quantityBefore);
  expect(indexOf(after, 'Priority')).not.toBe(priorityBefore);
});

it('the actions column cannot be dragged, pinned, or hidden from the list', async ({
  page,
}) => {
  await openGrid(page);
  await openSettings(page);
  await selectTab(page, 'Columns');
  const actions = columnRow(page, 'Actions');
  await expect(actions.getByTestId('drag-handle')).toHaveCount(0);
  await expect(actions.getByRole('switch', { name: 'Pin' })).toBeDisabled();
  await expect(actions.getByRole('switch', { name: 'Show' })).toBeDisabled();
});

it('hiding a column from the header and showing it from the drawer', async ({
  page,
}) => {
  await openGrid(page);
  await openColumnMenu(page, 'Customer');
  await page.getByRole('button', { exact: true, name: 'Hide Column' }).click();
  await expect(columnHeader(page, 'Customer')).toHaveCount(0);

  await openSettings(page);
  await selectTab(page, 'Columns');
  await columnRow(page, 'Customer').getByText('Show', { exact: true }).click();
  await acceptSettings(page);
  await expect(columnHeader(page, 'Customer')).toBeVisible();
});

it('pin left keeps the column at the left edge after scrolling right', async ({
  page,
}) => {
  await openGrid(page);
  await openColumnMenu(page, 'Carrier');
  await page.getByRole('button', { exact: true, name: 'Pin Left' }).click();
  await scrollHorizontally(page, 'end');

  const container = await boxOf(scrollContainer(page), 'scroll container');
  const header = await boxOf(columnHeader(page, 'Carrier'), 'Carrier');
  expect(header.x).toBeGreaterThanOrEqual(container.x - 2);
  expect(header.x).toBeLessThan(container.x + 180);
});

it('pin right keeps the column inside the right edge at the start of the scroll', async ({
  page,
}) => {
  await openGrid(page);
  await openColumnMenu(page, 'Email');
  await page.getByRole('button', { exact: true, name: 'Pin Right' }).click();
  await scrollHorizontally(page, 'start');

  const container = await boxOf(scrollContainer(page), 'scroll container');
  const header = await boxOf(columnHeader(page, 'Email'), 'Email');
  expect(header.x + header.width).toBeGreaterThan(
    container.x + container.width - 240,
  );
  expect(header.x + header.width).toBeLessThanOrEqual(
    container.x + container.width + 2,
  );
});

it('the keyboard grows a column by one step and a double click clears it', async ({
  page,
}) => {
  await openGrid(page);
  const handle = page.getByRole('separator', {
    name: 'Resize Order Date column',
  });
  await handle.focus();
  const before = Number(await handle.getAttribute('aria-valuenow'));
  const minimum = await handle.getAttribute('aria-valuemin');

  if (minimum === null) {
    throw new Error('resize handle has no minimum');
  }

  await handle.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', String(before + 8));
  await handle.dblclick();
  await expect(handle).toHaveAttribute('aria-valuenow', minimum);
});

it('a pointer drag changes the column width and the width stays', async ({
  page,
}) => {
  await openGrid(page);
  const handle = page.getByRole('separator', {
    name: 'Resize Quantity column',
  });
  await expect(async () => {
    await handle.scrollIntoViewIfNeeded();
  }).toPass();
  const before = Number(await handle.getAttribute('aria-valuenow'));
  const box = await boxOf(handle, 'Quantity resize handle');
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 48, startY, { steps: 8 });
  await page.mouse.up();

  const after = Number(await handle.getAttribute('aria-valuenow'));
  expect(after).not.toBe(before);
  await page.mouse.move(0, 0);
  await expect(handle).toHaveAttribute('aria-valuenow', String(after));
});
