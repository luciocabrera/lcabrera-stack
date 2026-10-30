import { describe, expect, it } from 'vite-plus/test';

import { resolveTableDensity } from './resolveTableDensity.util';

describe('resolveTableDensity', () => {
  it('falls back to compact and its 32px row when nothing names a level', () => {
    expect(resolveTableDensity({ defaults: {}, state: {} })).toStrictEqual({
      density: 'compact',
      headerDensity: 'compact',
      headerRowHeight: 32,
      rowHeight: 32,
    });
  });

  it('takes the defaults when the state holds no level', () => {
    expect(
      resolveTableDensity({
        defaults: { density: 'dense', headerDensity: 'spacious' },
        state: {},
      }),
    ).toStrictEqual({
      density: 'dense',
      headerDensity: 'spacious',
      headerRowHeight: 48,
      rowHeight: 24,
    });
  });

  it('prefers the state over the defaults, for both rows', () => {
    expect(
      resolveTableDensity({
        defaults: { density: 'dense', headerDensity: 'dense' },
        state: { density: 'comfortable', headerDensity: 'spacious' },
      }),
    ).toStrictEqual({
      density: 'comfortable',
      headerDensity: 'spacious',
      headerRowHeight: 48,
      rowHeight: 40,
    });
  });

  it('lets the header follow the resolved density when nothing names its own', () => {
    expect(
      resolveTableDensity({
        defaults: { density: 'dense' },
        state: { density: 'spacious' },
      }),
    ).toMatchObject({ headerDensity: 'spacious', headerRowHeight: 48 });
  });

  it('lets an explicit rowHeight win over every level', () => {
    expect(
      resolveTableDensity({
        defaults: { headerDensity: 'spacious' },
        state: { density: 'dense', rowHeight: 36 },
      }),
    ).toStrictEqual({
      density: 'dense',
      headerDensity: 'spacious',
      headerRowHeight: 36,
      rowHeight: 36,
    });
  });
});
