import {
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
} from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vitest';

import { resolveColumnWidthBounds } from './resolveColumnWidthBounds.util';

describe('resolveColumnWidthBounds', () => {
  it('keeps both bounds when the column configures them', () => {
    expect(resolveColumnWidthBounds({ maxWidth: 400, minWidth: 80 })).toEqual({
      maxWidth: 400,
      minWidth: 80,
    });
  });

  it('falls back to the table defaults when a bound is unset', () => {
    expect(resolveColumnWidthBounds({})).toEqual({
      maxWidth: DEFAULT_MAX_COLUMN_WIDTH,
      minWidth: DEFAULT_MIN_COLUMN_WIDTH,
    });
  });

  it('resolves each side independently', () => {
    expect(resolveColumnWidthBounds({ minWidth: 80 })).toEqual({
      maxWidth: DEFAULT_MAX_COLUMN_WIDTH,
      minWidth: 80,
    });
    expect(resolveColumnWidthBounds({ maxWidth: 400 })).toEqual({
      maxWidth: 400,
      minWidth: DEFAULT_MIN_COLUMN_WIDTH,
    });
  });

  it('treats an explicit zero bound as configured rather than unset', () => {
    expect(resolveColumnWidthBounds({ maxWidth: 0, minWidth: 0 })).toEqual({
      maxWidth: 0,
      minWidth: 0,
    });
  });
});
