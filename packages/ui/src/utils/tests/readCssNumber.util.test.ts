import { describe, expect, it } from 'vite-plus/test';

import { readCssNumber } from './readCssNumber.util';

describe('readCssNumber', () => {
  it('reads a plain number as it is written', () => {
    expect(readCssNumber({ percentScale: 100, text: '-.81' })).toBe(-0.81);
  });

  it('scales a percentage to the channel range it names', () => {
    expect(readCssNumber({ percentScale: 100, text: '45%' })).toBe(45);
    expect(readCssNumber({ percentScale: 0.4, text: '50%' })).toBe(0.2);
  });
});
