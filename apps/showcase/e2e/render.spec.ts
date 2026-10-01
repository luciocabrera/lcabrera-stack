import { expect, test as it } from '@playwright/test';

import {
  expectDatasetCount,
  firstBodyCell,
  openGrid,
  scrollContainer,
} from './grid';
import { readOrderSample } from './oracle';

it('shows the dataset count and the first order number', async ({ page }) => {
  const sample = await readOrderSample();

  if (sample.orderNumber === undefined) {
    throw new Error('enterprise_orders returned a count and no first row');
  }

  await openGrid(page);
  await expectDatasetCount(page, sample.count);
  await expect(firstBodyCell(page, 'order_number')).toHaveText(
    sample.orderNumber,
  );
  await expect(scrollContainer(page)).toBeVisible();
  await expect(page.getByTestId('table-scroll-sentinel')).toHaveCount(1);
});
