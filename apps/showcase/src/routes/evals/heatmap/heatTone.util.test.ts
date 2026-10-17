import { describe, expect, it } from 'vite-plus/test';

import { heatTone } from './heatTone.util';

describe('heatTone', () => {
  it('colours a cell by its pass rate', () => {
    expect(heatTone(1)).toBe('high');
    expect(heatTone(0.9)).toBe('high');
    expect(heatTone(0.6)).toBe('mid');
    expect(heatTone(0.2)).toBe('low');
  });

  it('leaves a cell with no scored trial uncoloured', () => {
    expect(heatTone(undefined)).toBe('none');
  });
});
