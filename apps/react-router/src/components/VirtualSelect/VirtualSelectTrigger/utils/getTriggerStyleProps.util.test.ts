import { describe, expect, it, vi } from 'vitest';

const { propsMock } = vi.hoisted(() => ({
  propsMock: vi.fn((...args: unknown[]) => ({ args })),
}));

vi.mock('@stylexjs/stylex', () => ({
  props: propsMock,
}));

vi.mock('../VirtualSelectTrigger.stylex', () => ({
  styles: {
    trigger: 'trigger',
    triggerClamped: 'triggerClamped',
    triggerOpen: 'triggerOpen',
    triggerStatic: 'triggerStatic',
  },
}));

import { getTriggerStyleProps } from './getTriggerStyleProps.util';

describe('getTriggerStyleProps', () => {
  it('includes open and multi-mode styles', () => {
    expect(
      getTriggerStyleProps({ isOpen: true, mode: 'multi', isStatic: false }),
    ).toEqual({
      args: ['trigger', 'triggerOpen', 'triggerClamped', false],
    });
  });

  it('includes static styling when requested', () => {
    expect(
      getTriggerStyleProps({ isOpen: false, mode: 'single', isStatic: true }),
    ).toEqual({
      args: ['trigger', false, false, 'triggerStatic'],
    });
  });
});
