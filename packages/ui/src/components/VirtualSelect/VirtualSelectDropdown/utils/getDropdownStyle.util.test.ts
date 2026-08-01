import { describe, expect, it } from 'vite-plus/test';

import { getDropdownStyle } from './getDropdownStyle.util';

describe('getDropdownStyle', () => {
  it('returns dropdownFloating when isAlwaysOpen is false', () => {
    const result = getDropdownStyle({
      isAlwaysOpen: false,
      shouldFillHeight: false,
    });
    expect(result).toBeDefined();
  });

  it('returns dropdownFloating when isAlwaysOpen is undefined', () => {
    const result = getDropdownStyle({
      isAlwaysOpen: undefined,
      shouldFillHeight: false,
    });
    expect(result).toBeDefined();
  });

  it('returns dropdownStaticFill when isAlwaysOpen and shouldFillHeight', () => {
    const result = getDropdownStyle({
      isAlwaysOpen: true,
      shouldFillHeight: true,
    });
    expect(result).toBeDefined();
  });

  it('returns dropdownStatic when isAlwaysOpen and not shouldFillHeight', () => {
    const result = getDropdownStyle({
      isAlwaysOpen: true,
      shouldFillHeight: false,
    });
    expect(result).toBeDefined();
  });

  it('returns different styles for different combinations', () => {
    const abs = getDropdownStyle({
      isAlwaysOpen: false,
      shouldFillHeight: false,
    });
    const staticFill = getDropdownStyle({
      isAlwaysOpen: true,
      shouldFillHeight: true,
    });
    const staticNoFill = getDropdownStyle({
      isAlwaysOpen: true,
      shouldFillHeight: false,
    });
    expect(abs).not.toBe(staticFill);
    expect(abs).not.toBe(staticNoFill);
    expect(staticFill).not.toBe(staticNoFill);
  });
});
