import { expect, test as it } from '@playwright/test';

import { expectRightAligned } from './evalsPage';

const CELLS = `<table>
  <tr>
    <td style="width: 240px; text-align: right">12,345</td>
    <td style="width: 240px"><span style="display: block; width: 100%; text-align: right">67,890</span></td>
    <td style="width: 240px"><span style="display: block; width: 100%">left</span></td>
  </tr>
</table>
<table style="table-layout: fixed; width: 80px">
  <tr>
    <td style="overflow: hidden; white-space: nowrap; text-align: right">123,456,789,012</td>
    <td style="overflow: hidden; white-space: nowrap">123,456,789,012</td>
    <td style="text-align: right"> </td>
  </tr>
</table>`;

it('reads right alignment from the text, in a plain cell and in a full-width block span', async ({
  page,
}) => {
  await page.setContent(CELLS);

  const cells = page.getByRole('cell');

  await expectRightAligned(cells.nth(0));
  await expectRightAligned(cells.nth(1));
  await expect(expectRightAligned(cells.nth(2))).rejects.toThrow(
    'toBeLessThan',
  );
});

it('reads right alignment from the layout when the text fills its cell', async ({
  page,
}) => {
  await page.setContent(CELLS);

  const cells = page.getByRole('cell');

  await expectRightAligned(cells.nth(3));
  await expect(expectRightAligned(cells.nth(4))).rejects.toThrow(
    'toStrictEqual',
  );
});

it('refuses a cell with no text', async ({ page }) => {
  await page.setContent(CELLS);

  await expect(
    expectRightAligned(page.getByRole('cell').nth(5)),
  ).rejects.toThrow('toBeGreaterThan');
});
