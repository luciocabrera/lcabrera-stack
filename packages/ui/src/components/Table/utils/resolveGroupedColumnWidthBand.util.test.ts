import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
  DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
} from '../Table.constants';
import { resolveGroupedColumnWidthBand } from './resolveGroupedColumnWidthBand.util';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveGroupedColumnWidthBand', () => {
  it('takes the table defaults when the build declares no band', () => {
    expect(resolveGroupedColumnWidthBand()).toStrictEqual({
      maxWidth: DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
      minWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
    });
  });

  it('falls back per end, so one unusable value does not lose the other', () => {
    vi.stubEnv('VITE_TABLE_AGGREGATE_MIN_WIDTH', 'wide');
    vi.stubEnv('VITE_TABLE_AGGREGATE_MAX_WIDTH', '900');

    expect(resolveGroupedColumnWidthBand()).toStrictEqual({
      maxWidth: 900,
      minWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
    });
  });

  it('collapses to the floor when the declared band is inverted', () => {
    vi.stubEnv('VITE_TABLE_AGGREGATE_MIN_WIDTH', '400');
    vi.stubEnv('VITE_TABLE_AGGREGATE_MAX_WIDTH', '100');

    expect(resolveGroupedColumnWidthBand()).toStrictEqual({
      maxWidth: 400,
      minWidth: 400,
    });
  });
});
