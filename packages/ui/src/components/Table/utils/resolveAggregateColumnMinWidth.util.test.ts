import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH } from '../Table.constants';
import { resolveAggregateColumnMinWidth } from './resolveAggregateColumnMinWidth.util';

describe('resolveAggregateColumnMinWidth', () => {
  it('starts at the aggregate floor when the source declares no width', () => {
    expect(resolveAggregateColumnMinWidth({})).toBe(
      DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
    );
  });

  it('lifts a source narrower than the floor up to it', () => {
    expect(
      resolveAggregateColumnMinWidth({
        minWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH - 40,
      }),
    ).toBe(DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH);
  });

  it('keeps a source already wider than the floor', () => {
    expect(
      resolveAggregateColumnMinWidth({
        minWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH + 40,
      }),
    ).toBe(DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH + 40);
  });

  it('never crosses a declared maximum, floor or source', () => {
    expect(
      resolveAggregateColumnMinWidth({
        maxWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH - 80,
      }),
    ).toBe(DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH - 80);
    expect(
      resolveAggregateColumnMinWidth({
        maxWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH + 20,
        minWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH + 100,
      }),
    ).toBe(DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH + 20);
  });

  it('leaves a maximum above the floor to the column itself', () => {
    expect(
      resolveAggregateColumnMinWidth({
        maxWidth: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH + 200,
      }),
    ).toBe(DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH);
  });
});
