import { describe, expect, it } from 'vite-plus/test';

import type { SettingsDraft } from '../Settings.types';

import { getSettingsDraftChanges } from './getSettingsDraftChanges.util';

const baseline: SettingsDraft = {
  navigationCollapsed: 'expanded',
  navigationSize: 'small',
  orderConflictResolution: 'always-ask',
  pinConflictResolution: 'always-ask',
  pinSide: 'always-ask',
  unpinConflictResolution: 'always-ask',
};

describe('getSettingsDraftChanges', () => {
  it('reports no changes for an identical draft', () => {
    expect(getSettingsDraftChanges({ baseline, draft: baseline })).toEqual({
      hasChanges: false,
      hasNavigationChanges: false,
      hasPinningChanges: false,
    });
  });

  it('flags navigation-only changes', () => {
    const draft: SettingsDraft = { ...baseline, navigationSize: 'large' };

    expect(getSettingsDraftChanges({ baseline, draft })).toEqual({
      hasChanges: true,
      hasNavigationChanges: true,
      hasPinningChanges: false,
    });
  });

  it('flags pinning-only changes', () => {
    const draft: SettingsDraft = { ...baseline, pinSide: 'left' };

    expect(getSettingsDraftChanges({ baseline, draft })).toEqual({
      hasChanges: true,
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
      hasNavigationChanges: true,
      hasPinningChanges: true,
    });
  });
});
