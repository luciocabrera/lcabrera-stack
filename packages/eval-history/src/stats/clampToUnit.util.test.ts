import { describe, expect, it } from 'vite-plus/test';

import { clampToUnit } from './clampToUnit.util.ts';

describe('clampToUnit', () => {
  it('keeps a value inside [0, 1] as it is', () => {
    expect(clampToUnit(0.5)).toBe(0.5);
    expect(clampToUnit(0)).toBe(0);
    expect(clampToUnit(1)).toBe(1);
  });

  it('pulls floating-point overshoot back to the bound', () => {
    expect(clampToUnit(-2.7755575615628914e-17)).toBe(0);
    expect(clampToUnit(1 + Number.EPSILON)).toBe(1);
  });
});
