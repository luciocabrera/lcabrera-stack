import { expect, it } from 'vite-plus/test';

import type { FilterOptionsSources } from './resolve-filter-options-source.util.ts';

import { resolveFilterOptionsSource } from './resolve-filter-options-source.util.ts';

const SOURCES: FilterOptionsSources = {
  'public.enterprise_orders': {
    customer_rating: 'number',
    order_status: 'text',
  },
  'sales.car_sales': { color: 'text' },
};

it('resolves an allow-listed column to its type and the source column list', () => {
  expect(
    resolveFilterOptionsSource({
      column: 'order_status',
      schema: 'public',
      sources: SOURCES,
      table: 'enterprise_orders',
    }),
  ).toStrictEqual({
    allowed: true,
    allowedColumns: ['customer_rating', 'order_status'],
    columnType: 'text',
  });
});

it('carries each column its own type rather than one per source', () => {
  const resolution = resolveFilterOptionsSource({
    column: 'customer_rating',
    schema: 'public',
    sources: SOURCES,
    table: 'enterprise_orders',
  });

  expect(resolution).toStrictEqual({
    allowed: true,
    allowedColumns: ['customer_rating', 'order_status'],
    columnType: 'number',
  });
});

it('refuses a schema/table pair the registry does not list', () => {
  expect(
    resolveFilterOptionsSource({
      column: 'color',
      schema: 'public',
      sources: SOURCES,
      table: 'car_sales',
    }),
  ).toStrictEqual({ allowed: false, refusal: 'unknown-source' });
});

it('refuses a column the source does not expose, separately from an unknown source', () => {
  expect(
    resolveFilterOptionsSource({
      column: 'internal_notes',
      schema: 'public',
      sources: SOURCES,
      table: 'enterprise_orders',
    }),
  ).toStrictEqual({ allowed: false, refusal: 'unknown-column' });
});

it('refuses a column name inherited from Object.prototype', () => {
  expect(
    resolveFilterOptionsSource({
      column: 'constructor',
      schema: 'public',
      sources: SOURCES,
      table: 'enterprise_orders',
    }),
  ).toStrictEqual({ allowed: false, refusal: 'unknown-column' });
});

// The other half of the rule above: refusing an *inherited* prototype name must
// not refuse a real column that happens to share one. That is why the guard is
// `Object.hasOwn` — a denylist of prototype names would reject this column, and
// `column in columns` walks the prototype chain, so it would let the inherited
// one back through.
it('allows a column the registry really lists, prototype name or not', () => {
  const sources: FilterOptionsSources = {
    'public.audit': { constructor: 'text' as const },
  };

  expect(
    resolveFilterOptionsSource({
      column: 'constructor',
      schema: 'public',
      sources,
      table: 'audit',
    }),
  ).toStrictEqual({
    allowed: true,
    allowedColumns: ['constructor'],
    columnType: 'text',
  });
});
