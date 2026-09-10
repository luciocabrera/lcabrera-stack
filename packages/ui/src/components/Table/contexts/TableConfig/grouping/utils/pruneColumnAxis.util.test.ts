import { describe, expect, it } from 'vite-plus/test';

import { pruneColumnAxis } from './pruneColumnAxis.util';

describe('pruneColumnAxis', () => {
  it('keeps an axis that is not also a row key', () => {
    expect(
      pruneColumnAxis({ columnAxis: 'order_status', keys: ['region'] }),
    ).toBe('order_status');
  });

  it('drops an axis that is also a row key', () => {
    expect(
      pruneColumnAxis({
        columnAxis: 'order_status',
        keys: ['order_status', 'region'],
      }),
    ).toBeUndefined();
  });

  it('drops an unset axis', () => {
    expect(pruneColumnAxis({ keys: ['region'] })).toBeUndefined();
  });
});
