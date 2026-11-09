import { describe, expect, it } from 'vite-plus/test';

import { confusionRunHref } from './confusionRunHref.util';

describe('confusionRunHref', () => {
  it('opens the recent runs without a run parameter', () => {
    expect(confusionRunHref()).toBe('/evals/confusion');
  });

  it('names one run by ?run=, escaped', () => {
    expect(confusionRunHref('a b&c')).toBe('/evals/confusion?run=a+b%26c');
  });
});
