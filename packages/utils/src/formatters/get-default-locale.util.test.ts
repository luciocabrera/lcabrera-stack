import { describe, expect, it } from 'vitest';

import { getDefaultLocale } from './get-default-locale.util';

describe('getDefaultLocale', () => {
  it('returns en-US', () => {
    expect(getDefaultLocale()).toBe('en-US');
  });
});
