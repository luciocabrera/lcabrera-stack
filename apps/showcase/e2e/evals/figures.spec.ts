import type { Locator } from '@playwright/test';

import { expect, test as it } from '@playwright/test';

import {
  cellsOf,
  expectRightAligned,
  mainOf,
  openEvals,
  openTab,
  rowOf,
} from './evalsPage';

type FigureCellsArgs = {
  readonly figures: readonly number[];
  readonly row: Locator;
  readonly text: readonly number[];
};

const numericOf = (cell: Locator) =>
  cell.evaluate((element) => getComputedStyle(element).fontVariantNumeric);

const expectFigureCells = async ({ figures, row, text }: FigureCellsArgs) => {
  const cells = cellsOf(row);

  for (const index of figures) {
    await expectRightAligned(cells.nth(index));
    expect(await numericOf(cells.nth(index))).toBe('tabular-nums');
  }

  for (const index of text) {
    expect(await numericOf(cells.nth(index))).toBe('normal');
  }
};

it('sets every cost figure in tabular figures, right-aligned, and the name in proportional ones', async ({
  page,
}) => {
  await openEvals(page, '/evals/cost');
  await openTab(page, 'Per subject');

  await expectFigureCells({
    figures: [1, 2, 3, 4, 5, 6, 7, 8],
    row: rowOf(
      page,
      'skill react-19 59 59,000 11,800 5,900 read, 1,180 written $7.08 $0.3329 (41 of 59 trials priced) 18s 29s',
    ),
    text: [0],
  });
});

it('sets the health counts in tabular figures, right-aligned', async ({
  page,
}) => {
  await openEvals(page, '/evals/health');

  await expectFigureCells({
    figures: [2, 3],
    row: rowOf(page, 'error rate_limit 1 1'),
    text: [0, 1],
  });
  await expectFigureCells({
    figures: [1, 2, 3, 4],
    row: rowOf(page, '2026-10-13 02:00 on main 15 1 1 1'),
    text: [0],
  });
});

it('sets the confusion counts in tabular figures, right-aligned', async ({
  page,
}) => {
  await openEvals(page, '/evals/confusion');

  await expectFigureCells({
    figures: [1, 2, 3, 4, 5],
    row: rowOf(page, 'react-19 38 · 7 · 45'),
    text: [0],
  });
  await expect(mainOf(page).getByRole('table')).toHaveCount(1);
});
