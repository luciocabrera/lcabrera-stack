import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingRefusalReason } from '../Table.types';

import { isTableGroupingRefusalReason } from './isTableGroupingRefusalReason.util';

const TABLE_GROUPING_REFUSAL_REASONS = [
  'aggregate-not-legal',
  'column-axis-too-wide',
  'column-not-groupable',
  'duplicate-keys',
  'estimate-too-large',
  'no-keys',
  'row-limit-reached',
  'too-many-keys',
  'unknown-column',
] as const satisfies readonly TableGroupingRefusalReason[];

describe('isTableGroupingRefusalReason', () => {
  it.each(TABLE_GROUPING_REFUSAL_REASONS)('admits %s', (reason) => {
    expect(isTableGroupingRefusalReason(reason)).toBe(true);
  });

  it('refuses a token outside the vocabulary', () => {
    expect(isTableGroupingRefusalReason('not-a-dimension')).toBe(false);
    expect(isTableGroupingRefusalReason('')).toBe(false);
  });

  it('refuses a non-string', () => {
    expect(isTableGroupingRefusalReason(undefined)).toBe(false);
    expect(isTableGroupingRefusalReason(1)).toBe(false);
  });

  it('does not admit an inherited property through the prototype chain', () => {
    expect(isTableGroupingRefusalReason('toString')).toBe(false);
    expect(isTableGroupingRefusalReason('constructor')).toBe(false);
  });
});
