import { describe, expect, it } from 'vite-plus/test';

import { getInitialGroupingState } from './getInitialGroupingState.util';

describe('getInitialGroupingState', () => {
  it('seeds the keys the loader applied', () => {
    expect(
      getInitialGroupingState({ groupingKeys: ['order_status'] }),
    ).toStrictEqual({ keys: ['order_status'] });
  });

  it('defaults to no grouping when the loader supplied none', () => {
    expect(getInitialGroupingState({})).toStrictEqual({ keys: [] });
  });

  it('copies the keys rather than aliasing the loader array', () => {
    const groupingKeys = ['order_status'];
    const state = getInitialGroupingState({ groupingKeys });

    expect(state.keys).not.toBe(groupingKeys);
    expect(state.keys).toStrictEqual(groupingKeys);
  });
});
