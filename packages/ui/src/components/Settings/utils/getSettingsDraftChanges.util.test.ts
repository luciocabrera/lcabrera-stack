import { describe, expect, it } from 'vite-plus/test';

import type { SettingsDraft } from '../Settings.types';

import { getSettingsDraftChanges } from './getSettingsDraftChanges.util';

const baseline: SettingsDraft = {
  groupFold: 'expanded',
  groupingMode: 'flat',
  navigationCollapsed: 'expanded',
  navigationSize: 'small',
  orderConflictResolution: 'always-ask',
  pinConflictResolution: 'always-ask',
  pinSide: 'always-ask',
  totalsPlacement: 'last',
  unpinConflictResolution: 'always-ask',
};

describe('getSettingsDraftChanges', () => {
  it('reports no changes for an identical draft', () => {
    expect(getSettingsDraftChanges({ baseline, draft: baseline })).toEqual({
      hasChanges: false,
      hasGroupingChanges: false,
      hasNavigationChanges: false,
      hasPinningChanges: false,
    });
  });

  it('flags navigation-only changes', () => {
    const draft: SettingsDraft = { ...baseline, navigationSize: 'large' };

    expect(getSettingsDraftChanges({ baseline, draft })).toEqual({
      hasChanges: true,
      hasGroupingChanges: false,
      hasNavigationChanges: true,
      hasPinningChanges: false,
    });
  });

  it('flags pinning-only changes', () => {
    const draft: SettingsDraft = { ...baseline, pinSide: 'left' };

    expect(getSettingsDraftChanges({ baseline, draft })).toEqual({
      hasChanges: true,
      hasGroupingChanges: false,
      hasNavigationChanges: false,
      hasPinningChanges: true,
    });
  });

  it('flags both domains at once', () => {
    const draft: SettingsDraft = {
      ...baseline,
      navigationCollapsed: 'collapsed',
      unpinConflictResolution: 'unpin-beyond',
    };

    expect(getSettingsDraftChanges({ baseline, draft })).toEqual({
      hasChanges: true,
      hasGroupingChanges: false,
      hasNavigationChanges: true,
      hasPinningChanges: true,
    });
  });
});

describe('getSettingsDraftChanges — grouping', () => {
  it.each([
    { draft: { ...baseline, groupingMode: 'rollup' } },
    { draft: { ...baseline, totalsPlacement: 'first' } },
    { draft: { ...baseline, groupFold: 'collapsed' } },
  ] as const)('flags a grouping change on its own: %o', ({ draft }) => {
    expect(getSettingsDraftChanges({ baseline, draft })).toEqual({
      hasChanges: true,
      hasGroupingChanges: true,
      hasNavigationChanges: false,
      hasPinningChanges: false,
    });
  });

  it('flags grouping alongside the other domains', () => {
    expect(
      getSettingsDraftChanges({
        baseline,
        draft: {
          ...baseline,
          groupFold: 'collapsed',
          navigationSize: 'large',
          pinSide: 'left',
        },
      }),
    ).toEqual({
      hasChanges: true,
      hasGroupingChanges: true,
      hasNavigationChanges: true,
      hasPinningChanges: true,
    });
  });
});
