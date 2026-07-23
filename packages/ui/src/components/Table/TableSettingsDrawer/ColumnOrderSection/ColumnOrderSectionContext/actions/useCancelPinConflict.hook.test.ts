// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useCancelPinConflict } from './useCancelPinConflict.hook';

type ModalsState = { readonly conflictModal?: Record<string, unknown> };

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

describe('useCancelPinConflict', () => {
  it('closes the pin-conflict modal while preserving its other fields', () => {
    setModalsState({
      conflictModal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: true,
        side: 'left',
      },
    });

    const { result } = renderHook(() => useCancelPinConflict());

    act(() => {
      result.current();
    });

    expect(modalsStore.set).toHaveBeenCalledExactlyOnceWith({
      conflictModal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: false,
        side: 'left',
      },
    });
  });

  it('does nothing when there is no pin conflict in state', () => {
    setModalsState({});

    const { result } = renderHook(() => useCancelPinConflict());

    act(() => {
      result.current();
    });

    expect(modalsStore.set).not.toHaveBeenCalled();
  });
});
