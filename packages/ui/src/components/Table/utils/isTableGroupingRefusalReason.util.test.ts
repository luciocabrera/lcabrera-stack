import { describe, expect, it } from 'vite-plus/test';

import { isTableGroupingRefusalReason } from './isTableGroupingRefusalReason.util';
import { TABLE_GROUPING_REFUSAL_REASONS } from './refusal.constants';

describe('isTableGroupingRefusalReason', () => {
  it.each(Object.keys(TABLE_GROUPING_REFUSAL_REASONS))(
    'admits %s',
    (reason) => {
      expect(isTableGroupingRefusalReason(reason)).toBe(true);
    },
  );

  it('refuses a query-refusal reason and a token outside the vocabulary', () => {
    expect(isTableGroupingRefusalReason('column-not-allowed')).toBe(false);
    expect(isTableGroupingRefusalReason('not-a-dimension')).toBe(false);
  });
});
