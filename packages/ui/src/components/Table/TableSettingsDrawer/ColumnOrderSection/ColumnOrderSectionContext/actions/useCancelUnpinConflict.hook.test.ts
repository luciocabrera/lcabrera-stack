// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCancelUnpinConflict } from './useCancelUnpinConflict.hook';

type ModalsState = { readonly unpinConflictModal?: Record<string, unknown> };

const { modalsStore, setModalsState } = vi.hoisted(() => {
  let state: ModalsState | undefined;

  return {
    modalsStore: { get: vi.fn(() => state), set: vi.fn() },
    setModalsState: (next: ModalsState | undefined) => {
      state = next;
    },
  };
});

vi.mock('../useColumnOrderSectionContextValue.hook', () => ({
  useColumnOrderSectionContextValue: () => ({ modalsStore }),
}));

beforeEach(() => {
  modalsStore.set.mockClear();
  setModalsState(undefined);
});

describe('useCancelUnpinConflict', () => {
  it('closes the unpin-conflict modal while preserving its other fields', () => {
    setModalsState({
      unpinConflictModal: {
        columnKey: 'id',
        columnLabel: 'ID',
        isOpen: true,
        side: 'right',
      },
    });

    const { result } = renderHook(() => useCancelUnpinConflict());

    act(() => {
      result.current();
    });

    expect(modalsStore.set).toHaveBeenCalledExactlyOnceWith({
      unpinConflictModal: {
        columnKey: 'id',
        columnLabel: 'ID',
        isOpen: false,
        side: 'right',
      },
    });
  });

  it('does nothing when there is no unpin conflict in state', () => {
    setModalsState({});

    const { result } = renderHook(() => useCancelUnpinConflict());

    act(() => {
      result.current();
    });

    expect(modalsStore.set).not.toHaveBeenCalled();
  });
});
