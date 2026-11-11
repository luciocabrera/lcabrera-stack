import { describe, expect, it } from 'vite-plus/test';

import { resolveTableDensity } from './resolveTableDensity.util';

describe('resolveTableDensity', () => {
  it('falls back to compact and its 32px row when nothing names a level', () => {
    expect(resolveTableDensity({ defaults: {}, state: {} })).toStrictEqual({
      density: 'compact',
      headerDensity: 'compact',
      headerRowHeight: 32,
      rowHeight: 32,
      titleDensity: 'compact',
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
      titleDensity: 'dense',
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
      titleDensity: 'comfortable',
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

  it('lets an explicit rowHeight win over the levels of a header that follows the body', () => {
    expect(
      resolveTableDensity({
        defaults: {},
        state: { density: 'dense', rowHeight: 36 },
      }),
    ).toStrictEqual({
      density: 'dense',
      headerDensity: 'dense',
      headerRowHeight: 36,
      rowHeight: 36,
      titleDensity: 'dense',
    });
  });

  it('lets a named header density set the header height even when rowHeight is set', () => {
    expect(
      resolveTableDensity({
        defaults: { headerDensity: 'spacious' },
        state: { density: 'dense', rowHeight: 36 },
      }),
    ).toStrictEqual({
      density: 'dense',
      headerDensity: 'spacious',
      headerRowHeight: 48,
      rowHeight: 36,
      titleDensity: 'dense',
    });
    expect(
      resolveTableDensity({
        defaults: {},
        state: { headerDensity: 'comfortable', rowHeight: 36 },
      }),
    ).toMatchObject({ headerRowHeight: 40, rowHeight: 36 });
  });

  it('skips a level that is not one of the four, as a stale cookie could hold', () => {
    expect(
      resolveTableDensity({
        defaults: { density: 'spacious' },
        state: {
          density: 'tight' as never,
          headerDensity: 'tiny' as never,
          titleDensity: 'small' as never,
        },
      }),
    ).toStrictEqual({
      density: 'spacious',
      headerDensity: 'spacious',
      headerRowHeight: 48,
      rowHeight: 48,
      titleDensity: 'spacious',
    });
  });

  it('lets the title bar follow the resolved density when nothing names its own', () => {
    expect(
      resolveTableDensity({
        defaults: { density: 'dense', headerDensity: 'spacious' },
        state: { density: 'comfortable' },
      }),
    ).toMatchObject({ titleDensity: 'comfortable' });
  });

  it('prefers the state title density over the default, and either over the rows', () => {
    expect(
      resolveTableDensity({
        defaults: { titleDensity: 'dense' },
        state: { density: 'spacious', titleDensity: 'comfortable' },
      }),
    ).toMatchObject({ density: 'spacious', titleDensity: 'comfortable' });
    expect(
      resolveTableDensity({
        defaults: { titleDensity: 'dense' },
        state: { density: 'spacious' },
      }),
    ).toMatchObject({ density: 'spacious', titleDensity: 'dense' });
  });
});
