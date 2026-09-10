// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

const { isGroupingEnabledRef, isGroupingLockedRef, modeRef } = vi.hoisted(
  () => ({
    isGroupingEnabledRef: { current: true },
    isGroupingLockedRef: { current: false },
    modeRef: { current: 'flat' as 'flat' | 'rollup' },
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableIsGroupingEnabled: () => isGroupingEnabledRef.current,
  useGetTableIsGroupingLocked: () => isGroupingLockedRef.current,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingMode: () => modeRef.current,
}));

import { useHasAdvancedSettings } from './useHasAdvancedSettings.hook';

type AskArgs = {
  readonly isGroupingEnabled: boolean;
  readonly isGroupingLocked: boolean;
  readonly mode: 'flat' | 'rollup';
};

const ask = ({ isGroupingEnabled, isGroupingLocked, mode }: AskArgs) => {
  isGroupingEnabledRef.current = isGroupingEnabled;
  isGroupingLockedRef.current = isGroupingLocked;
  modeRef.current = mode;

  return renderHook(() => useHasAdvancedSettings()).result.current;
};

describe('useHasAdvancedSettings', () => {
  it('says no for a route that cannot group', () => {
    expect(
      ask({
        isGroupingEnabled: false,
        isGroupingLocked: false,
        mode: 'rollup',
      }),
    ).toBe(false);
  });

  it('says yes while the mode control can render', () => {
    expect(
      ask({ isGroupingEnabled: true, isGroupingLocked: false, mode: 'flat' }),
    ).toBe(true);
  });

  it('says no under a locked preset outside rollup, where both controls render nothing', () => {
    expect(
      ask({ isGroupingEnabled: true, isGroupingLocked: true, mode: 'flat' }),
    ).toBe(false);
  });

  it('says yes under a locked preset in rollup, where the position control remains', () => {
    expect(
      ask({ isGroupingEnabled: true, isGroupingLocked: true, mode: 'rollup' }),
    ).toBe(true);
  });
});
