// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCancelOrderConflict } from './useCancelOrderConflict.hook';

type ModalsState = { readonly orderConflict?: Record<string, unknown> };

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

describe('useCancelOrderConflict', () => {
  it('closes the order-conflict modal while preserving its other fields', () => {
    setModalsState({
      orderConflict: {
        description: 'conflict',
        isOpen: true,
        pendingOrder: ['id'],
        pendingPinning: { left: [], right: [] },
      },
    });

    const { result } = renderHook(() => useCancelOrderConflict());

    act(() => {
      result.current();
    });

    expect(modalsStore.set).toHaveBeenCalledExactlyOnceWith({
      orderConflict: {
        description: 'conflict',
        isOpen: false,
        pendingOrder: ['id'],
        pendingPinning: { left: [], right: [] },
      },
    });
  });

  it('does nothing when there is no order conflict in state', () => {
    setModalsState({});

    const { result } = renderHook(() => useCancelOrderConflict());

    act(() => {
      result.current();
    });

    expect(modalsStore.set).not.toHaveBeenCalled();
  });
});
