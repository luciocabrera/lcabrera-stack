import { expect, it } from 'vitest';

import { toCountSubquery } from './toCountSubquery.util';

it('wraps the data query as a count subquery and preserves params', () => {
  const result = toCountSubquery({
    text: 'SELECT "order_id" FROM "public"."enterprise_orders" WHERE "carrier" = $1',
    values: ['FedEx'],
  });

  expect(result.text).toBe(
    'SELECT count(*)::int AS count FROM (SELECT "order_id" FROM "public"."enterprise_orders" WHERE "carrier" = $1) AS subquery',
  );
  expect(result.values).toStrictEqual(['FedEx']);
});
