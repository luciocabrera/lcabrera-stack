import { describe, expect, it } from 'vite-plus/test';

import { toTableDensityPatch } from './toTableDensityPatch.util';

describe('toTableDensityPatch', () => {
  it('names nothing when the staged levels match the table', () => {
    expect(
      toTableDensityPatch({
        current: { density: 'dense', headerDensity: undefined },
        staged: { density: 'dense', headerDensity: undefined },
      }),
    ).toStrictEqual({});
  });

  it('names only the level that moved', () => {
    expect(
      toTableDensityPatch({
        current: { density: 'dense' },
        staged: { density: 'dense', headerDensity: 'spacious' },
      }),
    ).toStrictEqual({ headerDensity: 'spacious' });
  });

  it('names a cleared level with undefined, so the table drops its own value', () => {
    expect(
      toTableDensityPatch({
        current: { density: 'comfortable', headerDensity: 'dense' },
        staged: { density: undefined, headerDensity: 'dense' },
      }),
    ).toStrictEqual({ density: undefined });
  });
});
