import { describe, expect, it } from 'vitest';

import { derivePinCommandState } from './derivePinCommandState.util';

describe('derivePinCommandState', () => {
  it('is active and enabled when the column is pinned to the target side', () => {
    expect(
      derivePinCommandState({
        currentSide: 'left',
        isStatic: false,
        targetSide: 'left',
      }),
    ).toStrictEqual({ isActive: true, isEnabled: true });
  });

  it('is inactive when the column is pinned to the other side', () => {
    expect(
      derivePinCommandState({
        currentSide: 'right',
        isStatic: false,
        targetSide: 'left',
      }),
    ).toStrictEqual({ isActive: false, isEnabled: true });
  });

  it('is disabled for a static column', () => {
    expect(
      derivePinCommandState({
        currentSide: undefined,
        isStatic: true,
        targetSide: 'left',
      }),
    ).toStrictEqual({ isActive: false, isEnabled: false });
  });

  it('clear command (undefined target) is never active but enabled while pinned', () => {
    expect(
      derivePinCommandState({
        currentSide: 'left',
        isStatic: false,
        targetSide: undefined,
      }),
    ).toStrictEqual({ isActive: false, isEnabled: true });
  });

  it('clear command is disabled when nothing is pinned', () => {
    expect(
      derivePinCommandState({
        currentSide: undefined,
        isStatic: false,
        targetSide: undefined,
      }),
    ).toStrictEqual({ isActive: false, isEnabled: false });
  });
});
