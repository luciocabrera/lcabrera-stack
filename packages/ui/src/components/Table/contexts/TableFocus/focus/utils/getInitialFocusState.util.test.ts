import { describe, expect, it } from 'vite-plus/test';

import { getInitialFocusState } from './getInitialFocusState.util';

describe('getInitialFocusState', () => {
  it('starts with no target and no focus inside the grid', () => {
    expect(getInitialFocusState()).toEqual({
      columnKey: undefined,
      focusRequestId: 0,
      isGridFocused: false,
      rowIndex: undefined,
      rowKey: undefined,
    });
  });

  it('starts the request id at zero, which is how a cell reads "not me"', () => {
    expect(getInitialFocusState().focusRequestId).toBe(0);
  });

  it('answers a fresh object each call', () => {
    expect(getInitialFocusState()).not.toBe(getInitialFocusState());
  });
});
