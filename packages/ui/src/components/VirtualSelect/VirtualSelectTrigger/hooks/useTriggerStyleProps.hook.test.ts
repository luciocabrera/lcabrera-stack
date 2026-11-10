// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { getTriggerStylePropsMock } = vi.hoisted(() => ({
  getTriggerStylePropsMock: vi.fn(() => ({ className: 'trigger' })),
}));

vi.mock('#ui/components/VirtualList/contexts/list/selectors', () => ({
  useGetIsTopAttached: () => true,
}));

vi.mock('../../contexts/meta/selectors', () => ({
  useGetAttachedEdge: () => 'bottom',
  useGetIsInert: () => false,
  useGetIsOpen: () => true,
}));

vi.mock('../utils', () => ({
  getTriggerStyleProps: getTriggerStylePropsMock,
}));

import { useTriggerStyleProps } from './useTriggerStyleProps.hook';

describe('useTriggerStyleProps', () => {
  it('styles the trigger from the attach, inert and open state in the stores', () => {
    const { result } = renderHook(() =>
      useTriggerStyleProps({ hasTags: true, isStatic: false }),
    );

    expect(result.current).toStrictEqual({ className: 'trigger' });
    expect(getTriggerStylePropsMock).toHaveBeenCalledWith({
      attachedEdge: 'bottom',
      hasTags: true,
      isAttachedBelow: true,
      isInert: false,
      isOpen: true,
      isStatic: false,
    });
  });
});
