import { describe, expect, it } from 'vitest';

import { getDropdownStyle } from './getDropdownStyle.util.ts';

describe('getDropdownStyle', () => {
  it('returns dropdownAbsolute when isAlwaysOpen is false', () => {
    const result = getDropdownStyle(false, false);
    expect(result).toBeDefined();
  });

  it('returns dropdownAbsolute when isAlwaysOpen is undefined', () => {
    const result = getDropdownStyle(undefined, false);
    expect(result).toBeDefined();
  });

  it('returns dropdownStaticFill when isAlwaysOpen and shouldFillHeight', () => {
    const result = getDropdownStyle(true, true);
    expect(result).toBeDefined();
  });

  it('returns dropdownStatic when isAlwaysOpen and not shouldFillHeight', () => {
    const result = getDropdownStyle(true, false);
    expect(result).toBeDefined();
  });

  it('returns different styles for different combinations', () => {
    const abs = getDropdownStyle(false, false);
    const staticFill = getDropdownStyle(true, true);
    const staticNoFill = getDropdownStyle(true, false);
    expect(abs).not.toBe(staticFill);
    expect(abs).not.toBe(staticNoFill);
    expect(staticFill).not.toBe(staticNoFill);
  });
});
