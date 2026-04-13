import { describe, expect, it } from 'vitest';

import { getInitialModalsState } from './getInitialModalsState.util.ts';

describe('getInitialModalsState', () => {
  it('returns default state when called with no args', () => {
    const result = getInitialModalsState();
    expect(result.conflictModal.isOpen).toBe(false);
    expect(result.orderConflict.isOpen).toBe(false);
    expect(result.pinSideModal.isOpen).toBe(false);
    expect(result.unpinConflictModal.isOpen).toBe(false);
  });

  it('overrides specific fields when provided', () => {
    const result = getInitialModalsState({
      conflictModal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: true,
        side: 'left',
      },
    });
    expect(result.conflictModal.isOpen).toBe(true);
    expect(result.conflictModal.columnKey).toBe('name');
    // Other fields keep defaults
    expect(result.pinSideModal.isOpen).toBe(false);
  });
});
