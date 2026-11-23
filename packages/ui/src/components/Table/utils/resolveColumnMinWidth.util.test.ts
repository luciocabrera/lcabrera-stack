import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import { resolveColumnMinWidth } from './resolveColumnMinWidth.util';

describe('resolveColumnMinWidth', () => {
  it('keeps a declared minimum', () => {
    expect(resolveColumnMinWidth({ maxWidth: 40, minWidth: 80 })).toBe(80);
  });

  it('falls back to the default minimum when nothing is declared', () => {
    expect(resolveColumnMinWidth({})).toBe(DEFAULT_MIN_COLUMN_WIDTH);
    expect(resolveColumnMinWidth({ maxWidth: 300 })).toBe(
      DEFAULT_MIN_COLUMN_WIDTH,
    );
  });

  it('caps the default minimum at a smaller declared maximum', () => {
    expect(resolveColumnMinWidth({ maxWidth: 40 })).toBe(40);
  });
});
