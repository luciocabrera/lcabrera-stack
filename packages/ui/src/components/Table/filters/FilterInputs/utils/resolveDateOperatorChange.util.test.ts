import { describe, expect, it } from 'vite-plus/test';

import { resolveDateOperatorChange } from './resolveDateOperatorChange.util';

describe('resolveDateOperatorChange', () => {
  it('seeds an empty date filter when none exists', () => {
    expect(resolveDateOperatorChange({ operator: 'before' })).toEqual({
      operator: 'before',
      type: 'date',
      value: '',
    });
  });

  it('keeps the drafted date and the between second date', () => {
    expect(
      resolveDateOperatorChange({
        filter: {
          operator: 'between',
          type: 'date',
          value: '2026-01-01',
          value2: '2026-02-01',
        },
        operator: 'after',
      }),
    ).toEqual({
      operator: 'after',
      type: 'date',
      value: '2026-01-01',
      value2: '2026-02-01',
    });
  });

  it('rebuilds fresh when the existing filter is not a date filter', () => {
    expect(
      resolveDateOperatorChange({
        filter: { operator: 'equals', type: 'text', value: 'alpha' },
        operator: 'equals',
      }),
    ).toEqual({ operator: 'equals', type: 'date', value: '' });
  });
});
