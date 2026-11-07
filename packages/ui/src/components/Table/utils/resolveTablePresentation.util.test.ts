import { describe, expect, it } from 'vite-plus/test';

import { resolveTablePresentation } from './resolveTablePresentation.util';

describe('resolveTablePresentation', () => {
  it('defaults to the virtual layout with every feature on', () => {
    expect(resolveTablePresentation({})).toStrictEqual({
      features: {
        columnMenu: true,
        resize: true,
        settings: true,
        toolbar: true,
      },
      layout: 'virtual',
    });
  });

  it('turns every feature off by default in the static layout', () => {
    expect(resolveTablePresentation({ layout: 'static' })).toStrictEqual({
      features: {
        columnMenu: false,
        resize: false,
        settings: false,
        toolbar: false,
      },
      layout: 'static',
    });
  });

  it('keeps each feature the caller names and defaults the rest', () => {
    expect(
      resolveTablePresentation({
        features: { columnMenu: true, toolbar: true },
        layout: 'static',
      }).features,
    ).toStrictEqual({
      columnMenu: true,
      resize: false,
      settings: false,
      toolbar: true,
    });
    expect(
      resolveTablePresentation({
        features: { resize: false, settings: false },
      }).features,
    ).toStrictEqual({
      columnMenu: true,
      resize: false,
      settings: false,
      toolbar: true,
    });
  });
});
