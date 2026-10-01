import type { LoaderFunctionArgs } from 'react-router';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectPage } from './.server/orders.reader';
import { loader } from './orders.loader';

vi.mock('./.server/orders.reader', () => ({
  selectGroupingCapabilities: vi.fn(async () => ({})),
  selectPage: vi.fn(async () => ({ data: [], hasMore: false, total: 0 })),
}));

const load = async (search: string) => {
  const result = await loader({
    request: new Request(`http://localhost/${search}`),
  } as LoaderFunctionArgs);
  await result.dataPromise;
  return result;
};

const lastRead = () => {
  const read = vi.mocked(selectPage).mock.calls.at(-1)?.[0];
  if (read === undefined) throw new Error('the loader read no page');
  return read;
};

const param = (value: unknown) => encodeURIComponent(JSON.stringify(value));

beforeEach(() => {
  vi.mocked(selectPage).mockClear();
});

describe('the orders loader', () => {
  it('orders the read by the sort the request names, then by the key', async () => {
    await load(`?sorting=${param({ total_amount: 'desc' })}`);

    expect(lastRead().sort).toEqual([
      { column: 'total_amount', direction: 'desc' },
      { column: 'order_id', direction: 'asc' },
    ]);
  });

  it('orders the read by the key alone when the request names no sort', async () => {
    await load('');

    expect(lastRead().sort).toEqual([{ column: 'order_id', direction: 'asc' }]);
  });

  it('hands the filters the request names to the read', async () => {
    await load(`?filters=${param({ order_status: ['eq', 'Delivered'] })}`);

    expect(lastRead().filters).toEqual([
      { column: 'order_status', operator: 'eq', value: 'Delivered' },
    ]);
  });

  it('reads the first page, with its total', async () => {
    await load('');

    expect(lastRead()).toMatchObject({ includeTotal: true, offset: 0 });
  });
});
