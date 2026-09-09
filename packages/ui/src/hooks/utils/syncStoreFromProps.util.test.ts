import { describe, expect, it } from 'vite-plus/test';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

import { syncStoreFromProps } from './syncStoreFromProps.util';

type TestState = {
  readonly count: number;
  readonly label: string;
};

describe('syncStoreFromProps', () => {
  it('writes the incoming snapshot into the store', () => {
    const store = createMockStore<TestState>({ count: 0, label: 'initial' });

    syncStoreFromProps({
      next: { count: 2, label: 'later' },
      store,
    });

    expect(store.get()).toEqual({ count: 2, label: 'later' });
  });

  it('merges a partial snapshot the way the store does', () => {
    const store = createMockStore<TestState>({ count: 0, label: 'initial' });

    syncStoreFromProps({ next: { count: 4 }, store });

    expect(store.get()).toEqual({ count: 4, label: 'initial' });
  });
});
