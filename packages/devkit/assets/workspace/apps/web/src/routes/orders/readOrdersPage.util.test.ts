import { describe, expect, it } from 'vite-plus/test';

import { PAGE_LIMIT } from './Orders.constants';
import { ORDER_ROWS } from './orders.rows';
import { readOrdersPage } from './readOrdersPage.util';

describe('readOrdersPage', () => {
  it('answers a page of rows with the total the table shows', async () => {
    const page = await readOrdersPage({ limit: PAGE_LIMIT, skip: 0 });

    expect(page.data.length).toBeGreaterThan(0);
    expect(page.data.length).toBeLessThanOrEqual(PAGE_LIMIT);
    expect(page.total).toBeGreaterThanOrEqual(page.data.length);
  });

  it('answers every row the module holds in the page the route asks for', async () => {
    const page = await readOrdersPage({ limit: PAGE_LIMIT, skip: 0 });

    expect(ORDER_ROWS.length).toBeGreaterThan(0);
    expect(page.data).toHaveLength(ORDER_ROWS.length);
    expect(page.total).toBe(page.data.length);
    expect(page.hasMore).toBe(false);
  });

  it('reports more rows when the window ends short of the total', async () => {
    const page = await readOrdersPage({ limit: 1, skip: 0 });

    expect(page.data).toHaveLength(1);
    expect(page.hasMore).toBe(true);
  });

  it('reports the end of the set once the window reaches it', async () => {
    const { total } = await readOrdersPage({ limit: 1, skip: 0 });
    const page = await readOrdersPage({ limit: total ?? 0, skip: 0 });

    expect(page.hasMore).toBe(false);
  });

  it('rounds every derived amount to whole cents', async () => {
    const page = await readOrdersPage({ limit: PAGE_LIMIT, skip: 0 });

    const unrounded = page.data.filter(
      (order) => Math.round(order.total * 100) !== order.total * 100,
    );

    expect(unrounded).toEqual([]);
  });
});
