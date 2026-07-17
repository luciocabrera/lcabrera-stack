// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { createMockStore } from '@repo/ui/utils/tests/createMockStore.util';
import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { ColumnOrderSectionContextValue } from './ColumnOrderSectionContext.types';

import { useCancelPinSide } from './actions/useCancelPinSide.hook';
import { ColumnOrderSectionContext } from './ColumnOrderSectionContext.context';
import { useGetConflictModal } from './selectors/useGetConflictModal.hook';
import { useGetOrderConflict } from './selectors/useGetOrderConflict.hook';
import { useGetPinSideModal } from './selectors/useGetPinSideModal.hook';
import { useGetUnpinConflictModal } from './selectors/useGetUnpinConflictModal.hook';
import { useColumnOrderSectionContextValue } from './useColumnOrderSectionContextValue.hook';
import { useModalsStore } from './useModalsStore.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const modalsStore = createMockStore({
  conflictModal: {
    columnKey: 'status',
    columnLabel: 'Status',
    isOpen: false,
    side: 'left' as const,
  },
  orderConflict: {
    description: 'Pending reorder',
    isOpen: true,
    pendingOrder: ['id', 'status'],
    pendingPinning: { left: ['id'], right: [] },
  },
  pinSideModal: {
    columnKey: 'status',
    columnLabel: 'Status',
    isOpen: true,
  },
  unpinConflictModal: {
    columnKey: 'status',
    columnLabel: 'Status',
    isOpen: false,
    side: 'right' as const,
  },
});

const contextValue: ColumnOrderSectionContextValue = {
  modalsStore: modalsStore as never,
};

const Wrapper = ({ children }: WrapperProps) =>
  createElement(ColumnOrderSectionContext, { value: contextValue }, children);

describe('ColumnOrderSectionContext hooks', () => {
  it('returns the column-order context value', () => {
    expect(
      renderHook(() => useColumnOrderSectionContextValue(), {
        wrapper: Wrapper,
      }).result.current,
    ).toBe(contextValue);
  });

  it('subscribes to modal-store changes and exposes selector hooks', () => {
    expect(
      renderHook(() => useModalsStore((state) => state.pinSideModal.isOpen), {
        wrapper: Wrapper,
      }).result.current,
    ).toBe(true);
    expect(
      renderHook(() => useGetConflictModal(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      columnKey: 'status',
      columnLabel: 'Status',
      isOpen: false,
      side: 'left',
    });
    expect(
      renderHook(() => useGetOrderConflict(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      description: 'Pending reorder',
      isOpen: true,
      pendingOrder: ['id', 'status'],
      pendingPinning: { left: ['id'], right: [] },
    });
    expect(
      renderHook(() => useGetPinSideModal(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      columnKey: 'status',
      columnLabel: 'Status',
      isOpen: true,
    });
    expect(
      renderHook(() => useGetUnpinConflictModal(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      columnKey: 'status',
      columnLabel: 'Status',
      isOpen: false,
      side: 'right',
    });
  });

  it('closes the pin-side modal through the cancel action', () => {
    const { result } = renderHook(() => useCancelPinSide(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current();
    });

    expect(modalsStore.get().pinSideModal.isOpen).toBe(false);
  });
});
