import {
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
} from '@repo/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vitest';

import { createResizeStartData } from './createResizeStartData.util';

describe('createResizeStartData', () => {
  it('snapshots the drag origin with the configured bounds', () => {
    expect(
      createResizeStartData({
        clientX: 100,
        currentWidth: 200,
        maxWidth: 260,
        minWidth: 120,
      }),
    ).toEqual({
      initialWidth: 200,
      initialX: 100,
      maxWidth: 260,
      minWidth: 120,
    });
  });

  it('falls back to the default bounds when the column configures none', () => {
    expect(createResizeStartData({ clientX: 100 })).toEqual({
      initialWidth: DEFAULT_MIN_COLUMN_WIDTH,
      initialX: 100,
      maxWidth: DEFAULT_MAX_COLUMN_WIDTH,
      minWidth: DEFAULT_MIN_COLUMN_WIDTH,
    });
  });

  it('uses the effective min width as the starting width when current width is unknown', () => {
    expect(
      createResizeStartData({ clientX: 100, minWidth: 150 }).initialWidth,
    ).toBe(150);
  });
});
