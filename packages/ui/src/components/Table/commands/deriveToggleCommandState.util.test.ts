import { describe, expect, it } from 'vite-plus/test';

import { deriveToggleCommandState } from './deriveToggleCommandState.util';

describe('deriveToggleCommandState', () => {
  it('is active and enabled when current equals the target (pinning side)', () => {
    expect(
      deriveToggleCommandState<'left' | 'right'>({
        current: 'left',
        isDisabled: false,
        target: 'left',
      }),
    ).toStrictEqual({ isActive: true, isEnabled: true });
  });

  it('is inactive when current differs from the target (sorting direction)', () => {
    expect(
      deriveToggleCommandState<'asc' | 'desc'>({
        current: 'desc',
        isDisabled: false,
        target: 'asc',
      }),
    ).toStrictEqual({ isActive: false, isEnabled: true });
  });

  it('is disabled when the capability is unavailable for the column', () => {
    expect(
      deriveToggleCommandState<'left' | 'right'>({
        current: undefined,
        isDisabled: true,
        target: 'left',
      }),
    ).toStrictEqual({ isActive: false, isEnabled: false });
  });

  it('clear command (undefined target) is never active but enabled while a value is set', () => {
    expect(
      deriveToggleCommandState<'asc' | 'desc'>({
        current: 'asc',
        isDisabled: false,
        target: undefined,
      }),
    ).toStrictEqual({ isActive: false, isEnabled: true });
  });

  it('clear command is disabled when there is nothing to clear', () => {
    expect(
      deriveToggleCommandState<'left' | 'right'>({
        current: undefined,
        isDisabled: false,
        target: undefined,
      }),
    ).toStrictEqual({ isActive: false, isEnabled: false });
  });
});
