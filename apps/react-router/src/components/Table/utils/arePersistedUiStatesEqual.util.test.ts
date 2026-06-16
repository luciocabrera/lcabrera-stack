import { describe, expect, it } from 'vitest';

import type { PersistedUiState } from './persistence.types';

import { arePersistedUiStatesEqual } from './arePersistedUiStatesEqual.util';

const baseState: PersistedUiState = {
  columnSettingsSelectedTab: 'general',
  isColumnSettingsOpen: false,
  isColumnSettingsPinned: false,
  isTableSettingsOpen: false,
  isTableSettingsPinned: false,
  tableSettingsExpandedFilters: ['status', 'priority'],
  tableSettingsSelectedTab: 'filters',
};

describe('arePersistedUiStatesEqual', () => {
  it('returns true for equivalent persisted ui state', () => {
    expect(
      arePersistedUiStatesEqual({
        left: baseState,
        right: { ...baseState },
      }),
    ).toBe(true);
  });

  it('returns false when scalar persisted fields differ', () => {
    expect(
      arePersistedUiStatesEqual({
        left: baseState,
        right: { ...baseState, isTableSettingsOpen: true },
      }),
    ).toBe(false);
  });

  it('returns false when expanded filters order differs', () => {
    expect(
      arePersistedUiStatesEqual({
        left: baseState,
        right: {
          ...baseState,
          tableSettingsExpandedFilters: ['priority', 'status'],
        },
      }),
    ).toBe(false);
  });

  it('returns true when expanded filters are both undefined', () => {
    expect(
      arePersistedUiStatesEqual({
        left: {
          ...baseState,
          tableSettingsExpandedFilters: undefined,
        },
        right: {
          ...baseState,
          tableSettingsExpandedFilters: undefined,
        },
      }),
    ).toBe(true);
  });
});
