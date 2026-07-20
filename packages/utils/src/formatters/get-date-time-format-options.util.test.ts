import { describe, expect, it } from 'vitest';

import { getDateTimeFormatOptions } from './get-date-time-format-options.util';

describe('getDateTimeFormatOptions', () => {
  it('returns full dateStyle for full preset', () => {
    expect(getDateTimeFormatOptions('full')).toEqual({ dateStyle: 'full' });
  });

  it('returns long dateStyle for long preset', () => {
    expect(getDateTimeFormatOptions('long')).toEqual({ dateStyle: 'long' });
  });

  it('returns medium dateStyle for medium preset', () => {
    expect(getDateTimeFormatOptions('medium')).toEqual({ dateStyle: 'medium' });
  });

  it('returns short dateStyle for short preset', () => {
    expect(getDateTimeFormatOptions('short')).toEqual({ dateStyle: 'short' });
  });
});
