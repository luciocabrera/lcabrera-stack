import { describe, expect, it } from 'vite-plus/test';

import { toGlobalGroupingPreferences } from './toGlobalGroupingPreferences.util';

describe('toGlobalGroupingPreferences', () => {
  it('reads every member of a complete payload', () => {
    expect(
      toGlobalGroupingPreferences({
        defaultFold: 'collapsed',
        mode: 'rollup',
        totalsPlacement: 'first',
      }),
    ).toEqual({
      defaultFold: 'collapsed',
      mode: 'rollup',
      totalsPlacement: 'first',
    });
  });

  it('drops a member the vocabulary does not carry rather than the whole payload', () => {
    expect(
      toGlobalGroupingPreferences({
        defaultFold: 'half-open',
        mode: 'cube',
        totalsPlacement: 'first',
      }),
    ).toEqual({
      defaultFold: undefined,
      mode: undefined,
      totalsPlacement: 'first',
    });
  });

  it('answers nothing for a value that is not an object', () => {
    expect(toGlobalGroupingPreferences(undefined)).toBeUndefined();
    expect(toGlobalGroupingPreferences('rollup')).toBeUndefined();
    expect(toGlobalGroupingPreferences(42)).toBeUndefined();
  });

  it('answers an empty preference set for an object carrying none', () => {
    expect(toGlobalGroupingPreferences({})).toEqual({
      defaultFold: undefined,
      mode: undefined,
      totalsPlacement: undefined,
    });
  });
});
