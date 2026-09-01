import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUPING_MODES } from '../Table.constants';
import { isTableGroupingMode } from './isTableGroupingMode.util';

describe('isTableGroupingMode', () => {
  it.each(TABLE_GROUPING_MODES)('accepts %s', (mode) => {
    expect(isTableGroupingMode(mode)).toBe(true);
  });

  it('refuses a mode this package does not render', () => {
    expect(isTableGroupingMode('cube')).toBe(false);
  });

  it('refuses an inherited property name', () => {
    expect(isTableGroupingMode('toString')).toBe(false);
  });

  it.each([undefined, 0, {}, ['rollup']])('refuses %s', (value) => {
    expect(isTableGroupingMode(value)).toBe(false);
  });

  it('refuses a JSON null, which is how an absent value arrives', () => {
    expect(isTableGroupingMode(JSON.parse('null'))).toBe(false);
  });
});
