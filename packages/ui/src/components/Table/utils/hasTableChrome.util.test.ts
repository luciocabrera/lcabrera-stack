import { describe, expect, it } from 'vite-plus/test';

import { hasTableChrome } from './hasTableChrome.util';

const NONE = {
  columnMenu: false,
  resize: false,
  settings: false,
  toolbar: false,
};

describe('hasTableChrome', () => {
  it('is false when every feature is off', () => {
    expect(hasTableChrome(NONE)).toBe(false);
  });

  it.each(Object.keys(NONE))('is true when only %s is on', (feature) => {
    expect(hasTableChrome({ ...NONE, [feature]: true })).toBe(true);
  });
});
