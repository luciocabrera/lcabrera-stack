import { describe, expect, it } from 'vite-plus/test';

import { AGGREGATE_SQL_NAMES } from './aggregate-sql.constants.ts';
import { buildColumnCapabilitiesQuery } from './build-column-capabilities-query.util.ts';

const DESCRIPTOR = {
  columns: ['order_status', 'total_amount'],
  schema: 'public',
  table: 'enterprise_orders',
} as const;

describe('buildColumnCapabilitiesQuery', () => {
  it('binds schema, table, the column list and the probed names', () => {
    const { values } = buildColumnCapabilitiesQuery(DESCRIPTOR);

    expect(values).toEqual([
      'public',
      'enterprise_orders',
      ['order_status', 'total_amount'],
      AGGREGATE_SQL_NAMES,
    ]);
  });

  // The property that makes this query safe to run on request-derived input:
  // there is no identifier to quote, because no identifier is interpolated.
  it('interpolates nothing a caller supplied into the text', () => {
    const { text } = buildColumnCapabilitiesQuery({
      columns: ['"; DROP TABLE users; --'],
      schema: 'evil"schema',
      table: 'evil"table',
    });

    expect(text).not.toContain('evil');
    expect(text).not.toContain('DROP TABLE');
    expect(text).toContain('WHERE n.nspname = $1 AND c.relname = $2');
    expect(text).toContain('a.attname = ANY($3::text[])');
  });

  it('probes each aggregate SQL name exactly once', () => {
    // `count` backs both `count` and `countDistinct`; asking twice would make
    // the catalogue do duplicate work for an answer that cannot differ.
    expect(AGGREGATE_SQL_NAMES).toEqual([
      'avg',
      'bool_and',
      'bool_or',
      'count',
      'max',
      'min',
      'sum',
    ]);
  });

  it('resolves a domain to its base type', () => {
    // Without this a domain over `text` has no category anyone recognises, so
    // Gate 1 refuses it as an unknown type.
    expect(buildColumnCapabilitiesQuery(DESCRIPTOR).text).toContain(
      'coalesce(nullif(t.typbasetype, 0), t.oid)',
    );
  });

  it('reads uninherited statistics only', () => {
    // A partition parent otherwise returns two rows per column.
    expect(buildColumnCapabilitiesQuery(DESCRIPTOR).text).toContain(
      's.inherited = false',
    );
  });

  it('skips dropped and system columns', () => {
    const { text } = buildColumnCapabilitiesQuery(DESCRIPTOR);

    expect(text).toContain('a.attnum > 0 AND NOT a.attisdropped');
  });
});
