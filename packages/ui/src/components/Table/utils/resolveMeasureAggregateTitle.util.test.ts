import { describe, expect, it } from 'vite-plus/test';

import { TABLE_MEASURE_AGGREGATE_SCOPE_LABEL } from '../Table.constants';
import { resolveMeasureAggregateTitle } from './resolveMeasureAggregateTitle.util';

describe('resolveMeasureAggregateTitle', () => {
  it('says nothing on the column that declares the aggregates', () => {
    expect(
      resolveMeasureAggregateTitle({ isMeasure: false, target: 'function' }),
    ).toBeUndefined();
    expect(
      resolveMeasureAggregateTitle({ isMeasure: false, target: 'clear' }),
    ).toBeUndefined();
  });

  it('states the band a function toggle reaches from a measure', () => {
    expect(
      resolveMeasureAggregateTitle({ isMeasure: true, target: 'function' }),
    ).toBe(
      `Applies to the whole band: ${TABLE_MEASURE_AGGREGATE_SCOPE_LABEL}.`,
    );
  });

  it('warns that clearing from a measure takes every sibling with it', () => {
    const title = resolveMeasureAggregateTitle({
      isMeasure: true,
      target: 'clear',
    });

    expect(title).toBe(
      `Clears every measure in the band: ${TABLE_MEASURE_AGGREGATE_SCOPE_LABEL}.`,
    );
    expect(title).toContain('every measure');
  });
});
