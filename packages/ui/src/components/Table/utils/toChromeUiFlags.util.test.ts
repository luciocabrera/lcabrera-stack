import { describe, expect, it } from 'vite-plus/test';

import { toChromeUiFlags } from './toChromeUiFlags.util';

describe('toChromeUiFlags', () => {
  it('drops totals placement and keeps the chrome flags', () => {
    expect(
      toChromeUiFlags({
        isTableSettingsOpen: true,
        totalsPlacement: 'first',
      }),
    ).toEqual({ isTableSettingsOpen: true });
  });

  it('returns an empty object when the payload is only a placement', () => {
    expect(toChromeUiFlags({ totalsPlacement: 'last' })).toEqual({});
  });
});
