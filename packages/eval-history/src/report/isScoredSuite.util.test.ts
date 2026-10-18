import { describe, expect, it } from 'vite-plus/test';

import { isScoredSuite } from './isScoredSuite.util.ts';

describe('isScoredSuite', () => {
  it('is true only for the suite whose baseline is a judge score', () => {
    expect(isScoredSuite('skill-quality')).toBe(true);
    expect(isScoredSuite('skills')).toBe(false);
    expect(isScoredSuite('rules-consistency')).toBe(false);
  });
});
