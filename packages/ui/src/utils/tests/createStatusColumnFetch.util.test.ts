import { describe, expect, it, vi } from 'vite-plus/test';

import { createStatusColumnFetch } from './createStatusColumnFetch.util';

describe('createStatusColumnFetch', () => {
  it('calls the fetch with the status column and the stores', () => {
    const fetchFn = vi.fn();
    const dataStore = { kind: 'data' };
    const metaStore = { kind: 'meta' };
    const load = createStatusColumnFetch({
      fetchFn,
      getStores: () => ({ dataStore, metaStore }),
    });

    load();

    expect(fetchFn).toHaveBeenCalledWith({
      columnKey: 'status',
      filtersDataStore: dataStore,
      metaStore,
    });
  });
});
