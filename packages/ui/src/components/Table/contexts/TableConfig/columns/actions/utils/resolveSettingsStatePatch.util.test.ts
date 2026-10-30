import { describe, expect, it } from 'vite-plus/test';

import { resolveSettingsStatePatch } from './resolveSettingsStatePatch.util';

describe('resolveSettingsStatePatch', () => {
  it('closes an unpinned panel and leaves the density alone when none is staged', () => {
    expect(
      resolveSettingsStatePatch({
        density: undefined,
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
        density: 'dense',
        metaState: { isTableSettingsPinned: true },
      }),
    ).toStrictEqual({
      closesSettings: false,
      hasDensityChanged: true,
      nextStatePatch: { density: 'dense' },
    });
  });

  it('closes an unpinned panel and carries the density in one patch', () => {
    expect(
      resolveSettingsStatePatch({ density: 'spacious', metaState: undefined }),
    ).toStrictEqual({
      closesSettings: true,
      hasDensityChanged: true,
      nextStatePatch: { density: 'spacious', isTableSettingsOpen: false },
    });
  });
});
