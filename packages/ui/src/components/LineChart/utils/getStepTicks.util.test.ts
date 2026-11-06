import { describe, expect, it } from 'vite-plus/test';

import { getStepTicks } from './getStepTicks.util';

describe('getStepTicks', () => {
  it('places every multiple of the step inside the range', () => {
    expect(getStepTicks({ end: 25, start: 3, step: 10 })).toEqual([
      new Date(10),
      new Date(20),
    ]);
  });

  it('keeps both ends when they fall on the step', () => {
    expect(getStepTicks({ end: 20, start: 0, step: 10 }).map(Number)).toEqual([
      0, 10, 20,
    ]);
  });
});
