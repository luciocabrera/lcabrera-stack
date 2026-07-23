import { describe, expect, it } from 'vite-plus/test';

import { getDefaultLocale } from './get-default-locale.util';

describe('getDefaultLocale', () => {
  it('returns en-US', () => {
    expect(getDefaultLocale()).toBe('en-US');
  });
});
