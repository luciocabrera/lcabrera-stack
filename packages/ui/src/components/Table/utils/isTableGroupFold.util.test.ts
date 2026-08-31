import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_FOLDS } from '../Table.constants';
import { isTableGroupFold } from './isTableGroupFold.util';

describe('isTableGroupFold', () => {
  it.each(TABLE_GROUP_FOLDS)('accepts %s', (fold) => {
    expect(isTableGroupFold(fold)).toBe(true);
  });

  it('refuses a string outside the vocabulary', () => {
    expect(isTableGroupFold('open')).toBe(false);
    expect(isTableGroupFold('')).toBe(false);
  });

  it('refuses a non-string, including one naming an Object member', () => {
    expect(isTableGroupFold(undefined)).toBe(false);
    expect(isTableGroupFold(0)).toBe(false);
    expect(isTableGroupFold({ collapsed: true })).toBe(false);
    expect(isTableGroupFold('toString')).toBe(false);
  });
});
