import { describe, expect, it } from 'vite-plus/test';

import { resolveSettingsStatePatch } from './resolveSettingsStatePatch.util';

describe('resolveSettingsStatePatch', () => {
  it('closes an unpinned panel and leaves the density alone when none is staged', () => {
    expect(
      resolveSettingsStatePatch({
        densityPatch: undefined,
        metaState: { isTableSettingsPinned: false },
      }),
    ).toStrictEqual({
      closesSettings: true,
      hasDensityChanged: false,
      nextStatePatch: { isTableSettingsOpen: false },
    });
  });

  it('keeps a pinned panel open and carries a staged density', () => {
    expect(
      resolveSettingsStatePatch({
        densityPatch: { density: 'dense' },
        metaState: { isTableSettingsPinned: true },
      }),
    ).toStrictEqual({
      closesSettings: false,
      hasDensityChanged: true,
      nextStatePatch: { density: 'dense' },
    });
  });

  it('closes an unpinned panel and carries both levels in one patch', () => {
    expect(
      resolveSettingsStatePatch({
        densityPatch: { density: 'spacious', headerDensity: 'dense' },
        metaState: undefined,
      }),
    ).toStrictEqual({
      closesSettings: true,
      hasDensityChanged: true,
      nextStatePatch: {
        density: 'spacious',
        headerDensity: 'dense',
        isTableSettingsOpen: false,
      },
    });
  });

  it('carries a cleared level as a change, so the table falls back to its default', () => {
    expect(
      resolveSettingsStatePatch({
        densityPatch: { headerDensity: undefined },
        metaState: { isTableSettingsPinned: true },
      }),
    ).toStrictEqual({
      closesSettings: false,
      hasDensityChanged: true,
      nextStatePatch: { headerDensity: undefined },
    });
  });

  it('carries a title bar level as a density change', () => {
    expect(
      resolveSettingsStatePatch({
        densityPatch: { titleDensity: 'spacious' },
        metaState: { isTableSettingsPinned: true },
      }),
    ).toStrictEqual({
      closesSettings: false,
      hasDensityChanged: true,
      nextStatePatch: { titleDensity: 'spacious' },
    });
  });
});
