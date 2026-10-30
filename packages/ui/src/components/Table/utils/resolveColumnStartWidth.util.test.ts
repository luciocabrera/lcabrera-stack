import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import { resolveColumnStartWidth } from './resolveColumnStartWidth.util';

describe('resolveColumnStartWidth', () => {
  it('takes a numeric width over the minimum', () => {
    expect(resolveColumnStartWidth({ minWidth: 80, width: 140 })).toBe(140);
  });

  it('falls back to the minimum when the width is fill or unset', () => {
    expect(resolveColumnStartWidth({ minWidth: 80, width: 'fill' })).toBe(80);
    expect(resolveColumnStartWidth({ minWidth: 80 })).toBe(80);
  });

  it('falls back to the default minimum when neither is set', () => {
    expect(resolveColumnStartWidth({})).toBe(DEFAULT_MIN_COLUMN_WIDTH);
  });
});
