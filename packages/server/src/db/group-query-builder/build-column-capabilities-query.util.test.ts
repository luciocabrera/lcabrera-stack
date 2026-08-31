import { describe, expect, it } from 'vite-plus/test';

import { buildColumnCapabilitiesQuery } from './build-column-capabilities-query.util.ts';
import { AGGREGATE_SQL_NAMES } from './group-query-builder.constants.ts';

const PERIOD_TYPE_NAMES = ['date', 'timestamp', 'timestamptz'];

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
      PERIOD_TYPE_NAMES,
    ]);
  });

  it('measures a zone-free column in a zone-free frame', () => {
    const { text } = buildColumnCapabilitiesQuery(DESCRIPTOR);

    expect(text).toContain("WHEN bt.typname = 'timestamptz'");
    expect(text).toContain('max(b::timestamptz) - min(b::timestamptz)');
    expect(text).toContain('max(b::timestamp) - min(b::timestamp)');
    expect(text.indexOf("WHEN bt.typname = 'timestamptz'")).toBeLessThan(
      text.indexOf('max(b::timestamptz)'),
    );
  });

  it('measures the histogram span only for a date or timestamp column', () => {
    const { text } = buildColumnCapabilitiesQuery(DESCRIPTOR);

    expect(text).toContain('WHEN bt.typname = ANY($5::text[])');
    expect(text).toContain('unnest(s.histogram_bounds::text::text[])');
    expect(text.indexOf('CASE WHEN bt.typname')).toBeLessThan(
      text.indexOf('unnest(s.histogram_bounds'),
    );
  });

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
    expect(buildColumnCapabilitiesQuery(DESCRIPTOR).text).toContain(
      'coalesce(nullif(t.typbasetype, 0), t.oid)',
    );
  });

  it('reads uninherited statistics only', () => {
    expect(buildColumnCapabilitiesQuery(DESCRIPTOR).text).toContain(
      's.inherited = false',
    );
  });

  it('skips dropped and system columns', () => {
    const { text } = buildColumnCapabilitiesQuery(DESCRIPTOR);

    expect(text).toContain('a.attnum > 0 AND NOT a.attisdropped');
  });
});
