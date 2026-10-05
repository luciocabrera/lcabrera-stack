import { describe, expect, it } from 'vite-plus/test';

import { selectTableCellBadgeTone } from './selectTableCellBadgeTone.util';

const params = {
  fallbackTone: 'neutral',
  rules: [
    { gte: 4, tone: 'success' },
    { gte: 3, tone: 'warning' },
    { gte: 2, tone: 'caution' },
    { gte: 0, tone: 'error' },
  ],
};

describe('selectTableCellBadgeTone', () => {
  it.each([
    { tone: 'success', value: 5 },
    { tone: 'success', value: 4 },
    { tone: 'warning', value: 3.9 },
    { tone: 'warning', value: 3 },
    { tone: 'caution', value: 2 },
    { tone: 'error', value: 1.99 },
    { tone: 'error', value: 0 },
  ])('lets the first matching rule win for $value', ({ tone, value }) => {
    expect(selectTableCellBadgeTone({ params, value })).toBe(tone);
  });

  it('uses the fallback tone when no rule matches', () => {
    expect(selectTableCellBadgeTone({ params, value: -1 })).toBe('neutral');
  });

  it('takes rule order over rule specificity', () => {
    expect(
      selectTableCellBadgeTone({
        params: {
          fallbackTone: 'neutral',
          rules: [
            { gte: 0, tone: 'error' },
            { gte: 4, tone: 'success' },
          ],
        },
        value: 5,
      }),
    ).toBe('error');
  });

  it('mixes categorical and numeric rules in one list', () => {
    const mixed = {
      fallbackTone: 'info',
      rules: [
        { equals: 'shipped', tone: 'success' },
        { gte: 10, tone: 'warning' },
      ],
    };

    expect(selectTableCellBadgeTone({ params: mixed, value: 'shipped' })).toBe(
      'success',
    );
    expect(selectTableCellBadgeTone({ params: mixed, value: 12 })).toBe(
      'warning',
    );
    expect(selectTableCellBadgeTone({ params: mixed, value: 'lost' })).toBe(
      'info',
    );
  });
});
