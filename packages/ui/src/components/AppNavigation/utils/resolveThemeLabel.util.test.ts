import { describe, expect, it } from 'vite-plus/test';

import { resolveThemeLabel } from './resolveThemeLabel.util';

describe('resolveThemeLabel', () => {
  it('returns "Light Mode" in dark mode', () => {
    expect(resolveThemeLabel(true)).toBe('Light Mode');
  });

  it('returns "Dark Mode" in light mode', () => {
    expect(resolveThemeLabel(false)).toBe('Dark Mode');
  });
});
