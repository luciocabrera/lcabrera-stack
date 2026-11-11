import { describe, expect, it } from 'vite-plus/test';

import { toGlobalTableDisplayPreferences } from './toGlobalTableDisplayPreferences.util';

describe('toGlobalTableDisplayPreferences', () => {
  it('keeps both levels when each names a density', () => {
    expect(
      toGlobalTableDisplayPreferences({
        density: 'comfortable',
        headerDensity: 'dense',
      }),
    ).toStrictEqual({ density: 'comfortable', headerDensity: 'dense' });
  });

  it('drops a value that is not a density', () => {
    expect(
      toGlobalTableDisplayPreferences({ density: 'huge', headerDensity: 3 }),
    ).toStrictEqual({ density: undefined, headerDensity: undefined });
  });

  it('reads nothing from a value that is not an object', () => {
    expect(toGlobalTableDisplayPreferences('compact')).toBeUndefined();
  });
});
