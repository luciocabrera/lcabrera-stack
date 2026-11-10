import { describe, expect, it, vi } from 'vite-plus/test';

const { propsMock } = vi.hoisted(() => ({
  propsMock: vi.fn((...args: unknown[]) => ({ args })),
}));

vi.mock('@stylexjs/stylex', () => ({
  props: propsMock,
}));

vi.mock('../VirtualSelectTrigger.stylex', () => ({
  styles: {
    trigger: 'trigger',
    triggerAttachedAbove: 'triggerAttachedAbove',
    triggerAttachedBelow: 'triggerAttachedBelow',
    triggerClamped: 'triggerClamped',
    triggerOpen: 'triggerOpen',
    triggerStatic: 'triggerStatic',
  },
}));

import { getTriggerStyleProps } from './getTriggerStyleProps.util';

describe('getTriggerStyleProps', () => {
  it('clamps the trigger to one tag row only while tags show', () => {
    expect(
      getTriggerStyleProps({ hasTags: true, isOpen: true, isStatic: false }),
    ).toEqual({
      args: [
        'trigger',
        false,
        'triggerOpen',
        false,
        'triggerClamped',
        false,
        false,
      ],
    });
  });

  it('includes static styling when requested', () => {
    expect(getTriggerStyleProps({ isOpen: false, isStatic: true })).toEqual({
      args: ['trigger', false, false, false, false, 'triggerStatic', false],
    });
  });

  it('squares the bottom of an open trigger with the dropdown attached below', () => {
    expect(
      getTriggerStyleProps({
        isAttachedBelow: true,
        isOpen: true,
      }),
    ).toEqual({
      args: [
        'trigger',
        false,
        'triggerOpen',
        'triggerAttachedBelow',
        false,
        false,
        false,
      ],
    });
  });

  it('leaves an empty multi trigger laid out like a single one', () => {
    expect(getTriggerStyleProps({ hasTags: false, isOpen: false })).toEqual({
      args: ['trigger', false, false, false, false, false, false],
    });
  });

  it('keeps a closed trigger rounded even while the flag is still set', () => {
    expect(
      getTriggerStyleProps({
        isAttachedBelow: true,
        isOpen: false,
      }),
    ).toEqual({ args: ['trigger', false, false, false, false, false, false] });
  });

  it('squares the edge a select shares with a neighbouring control', () => {
    expect(
      getTriggerStyleProps({ attachedEdge: 'bottom', isOpen: false }),
    ).toEqual({
      args: [
        'trigger',
        false,
        false,
        'triggerAttachedBelow',
        false,
        false,
        false,
      ],
    });
    expect(
      getTriggerStyleProps({
        attachedEdge: 'top',
        isOpen: false,
        isStatic: true,
      }),
    ).toEqual({
      args: [
        'trigger',
        false,
        false,
        false,
        false,
        'triggerStatic',
        'triggerAttachedAbove',
      ],
    });
  });
});
