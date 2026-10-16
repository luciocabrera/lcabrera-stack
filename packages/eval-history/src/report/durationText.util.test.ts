import { describe, expect, it } from 'vite-plus/test';

import { durationText } from './durationText.util.ts';

describe('durationText', () => {
  it('prints the median duration in seconds', () => {
    expect(durationText({ durationP50Ms: 13_250 })).toBe('13.3 s');
  });

  it('says when no trial recorded a duration', () => {
    expect(durationText({})).toBe('not recorded');
  });
});
