// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { goBackMock } = vi.hoisted(() => ({ goBackMock: vi.fn() }));

vi.mock('@lcabrera/ui/components/Form/contexts/FormContext/selectors', () => ({
  useGetFormCancelTo: () => '/orders',
}));

vi.mock('@lcabrera/ui/hooks', () => ({
  useBackNavigate: () => goBackMock,
}));

import { useFormDiscardConfirm } from './useFormDiscardConfirm.hook';

describe('useFormDiscardConfirm', () => {
  beforeEach(() => {
    goBackMock.mockReset();
  });

  it('opens the confirm dialog when cancelling a dirty form (no navigation)', () => {
    const { result } = renderHook(() => useFormDiscardConfirm());

    act(() => {
      result.current.handleCancelClick(true);
    });

    expect(result.current.isConfirmDiscardOpen).toBe(true);
    expect(goBackMock).not.toHaveBeenCalled();
  });

  it('navigates back when cancelling a clean form', () => {
    const { result } = renderHook(() => useFormDiscardConfirm());

    act(() => {
      result.current.handleCancelClick(false);
    });

    expect(result.current.isConfirmDiscardOpen).toBe(false);
    expect(goBackMock).toHaveBeenCalledExactlyOnceWith('/orders');
  });

  it('closes the dialog and navigates back on accept', () => {
    const { result } = renderHook(() => useFormDiscardConfirm());

    act(() => {
      result.current.handleCancelClick(true);
    });
    act(() => {
      result.current.handleAcceptConfirm();
    });

    expect(result.current.isConfirmDiscardOpen).toBe(false);
    expect(goBackMock).toHaveBeenCalledExactlyOnceWith('/orders');
  });

  it('closes the dialog without navigating on dismiss', () => {
    const { result } = renderHook(() => useFormDiscardConfirm());

    act(() => {
      result.current.handleCancelClick(true);
    });
    act(() => {
      result.current.handleCancelConfirm();
    });

    expect(result.current.isConfirmDiscardOpen).toBe(false);
    expect(goBackMock).not.toHaveBeenCalled();
  });
});
