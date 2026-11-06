import { describe, expect, it } from 'vite-plus/test';

import { readThemeSourceLines } from './readThemeSourceLines.util';

describe('readThemeSourceLines', () => {
  it('reads each theme from its own source, trimmed', () => {
    expect(readThemeSourceLines('light')).toContain(
      "brandPrimary: '#ffffff00', // 'oklch(0.24 0.12 259.78 / 0.88)',",
    );
    expect(readThemeSourceLines('dark')).not.toContain(
      "brandPrimary: '#ffffff00', // 'oklch(0.24 0.12 259.78 / 0.88)',",
    );
  });
});
