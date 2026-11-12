import { describe, expect, it } from 'vite-plus/test';

import { toGlobalTableDisplayPreferences } from './toGlobalTableDisplayPreferences.util';

describe('toGlobalTableDisplayPreferences', () => {
  it('keeps every level that names a density', () => {
    expect(
      toGlobalTableDisplayPreferences({
        density: 'comfortable',
        headerDensity: 'dense',
        titleDensity: 'spacious',
      }),
    ).toStrictEqual({
      density: 'comfortable',
      headerDensity: 'dense',
      titleDensity: 'spacious',
    });
  });

  it('drops a value that is not a density', () => {
    expect(
      toGlobalTableDisplayPreferences({
        density: 'huge',
        headerDensity: 3,
        titleDensity: 'tall',
      }),
    ).toStrictEqual({
      density: undefined,
      headerDensity: undefined,
      titleDensity: undefined,
    });
  });

  it('reads nothing from a value that is not an object', () => {
    expect(toGlobalTableDisplayPreferences('compact')).toBeUndefined();
  });
});
