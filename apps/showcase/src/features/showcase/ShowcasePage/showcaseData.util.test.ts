import { describe, expect, it, vi } from 'vite-plus/test';

import {
  FAKE_API_DELAY_MS,
  getTableDataPromise,
  resetTableDataPromise,
} from './showcaseData.util';

const loadRows = async () => {
  vi.useFakeTimers();
  resetTableDataPromise();
  const pending = getTableDataPromise();
  await vi.advanceTimersByTimeAsync(FAKE_API_DELAY_MS);
  const response = await pending;
  vi.useRealTimers();
  return response;
};

describe('the mock table data', () => {
  it('gives every declared column a value, so none falls through to the empty string', async () => {
    const { data, total } = await loadRows();
    const [first] = data;
    const last = data.at(-1);

    expect(total).toBe(data.length);
    expect(first).toBeDefined();
    expect(Object.values(first ?? {}).filter((cell) => cell === '')).toEqual(
      [],
    );
    expect(Object.values(last ?? {}).filter((cell) => cell === '')).toEqual([]);
  });

  it('spans the primitive shapes the column types produce', async () => {
    const { data } = await loadRows();
    const [first] = data;
    const kinds = new Set(
      Object.values(first ?? {}).map((cell) => typeof cell),
    );

    expect(kinds).toEqual(new Set(['boolean', 'number', 'string']));
  });
});
