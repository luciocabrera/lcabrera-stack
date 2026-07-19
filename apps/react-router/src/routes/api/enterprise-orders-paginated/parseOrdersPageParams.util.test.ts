import { expect, it } from 'vitest';

import { parseOrdersPageParams } from './parseOrdersPageParams.util';

it('parses limit/skip and translates the filter + sort payloads', () => {
  const params = new URLSearchParams({
    filter: JSON.stringify({
      is_vip_customer: { type: 'boolean', value: true },
    }),
    limit: '25',
    skip: '50',
    sort: JSON.stringify([{ columnKey: 'order_id', direction: 'desc' }]),
  });

  const result = parseOrdersPageParams(params);

  expect(result.limit).toBe(25);
  expect(result.skip).toBe(50);
  expect(result.filters).toStrictEqual([
    { column: 'is_vip_customer', operator: 'eq', value: true },
  ]);
  expect(result.sort).toStrictEqual([
    { column: 'order_id', direction: 'desc' },
  ]);
});

it('falls back for missing/invalid params and malformed JSON', () => {
  const result = parseOrdersPageParams(
    new URLSearchParams({ filter: '{bad', limit: '-1' }),
  );

  expect(result.skip).toBe(0);
  expect(result.filters).toStrictEqual([]);
  expect(result.sort).toStrictEqual([]);
  expect(result.limit).toBeGreaterThan(0);
});
