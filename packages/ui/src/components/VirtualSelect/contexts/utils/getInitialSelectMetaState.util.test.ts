import { describe, expect, it } from 'vite-plus/test';

import { getInitialSelectMetaState } from './getInitialSelectMetaState.util';

const baseArgs = {
  isAlwaysOpen: false,
  isBusy: false,
  isDisabled: false,
  isOpen: false,
  listboxId: 'listbox-id',
  mode: 'single' as const,
  placeholder: 'Select...',
};

describe('getInitialSelectMetaState', () => {
  it('mirrors the args and hides the list while closed', () => {
    const state = getInitialSelectMetaState(baseArgs);

    expect(state).toEqual({ ...baseArgs, isListVisible: false });
  });

  it('pre-computes isListVisible when the dropdown is open', () => {
    expect(
      getInitialSelectMetaState({ ...baseArgs, isOpen: true }).isListVisible,
    ).toBe(true);
  });

  it('pre-computes isListVisible for always-open selects', () => {
    expect(
      getInitialSelectMetaState({ ...baseArgs, isAlwaysOpen: true })
        .isListVisible,
    ).toBe(true);
  });
});
