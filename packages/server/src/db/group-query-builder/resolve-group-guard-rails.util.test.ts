import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { resolveGroupGuardRails } from './resolve-group-guard-rails.util.ts';

type CapabilityArgs = {
  readonly column: string;
  readonly distinctEstimate?: number;
};

const capability = ({
  column,
  distinctEstimate,
}: CapabilityArgs): ColumnGroupingCapability => ({
  aggregates: ['count'],
  canGroup: true,
  column,
  periods: [],
  role: 'dimension',
  typeName: 'text',
  ...(distinctEstimate !== undefined && { distinctEstimate }),
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  city: capability({ column: 'city', distinctEstimate: 900 }),
  country: capability({ column: 'country', distinctEstimate: 60 }),
  /** Small enough that `region x city` lands between the two thresholds. */
  region: capability({ column: 'region', distinctEstimate: 12 }),
  unanalysed: capability({ column: 'unanalysed' }),
};

type ResolveArgs = {
  readonly keys: readonly string[];
  readonly maxRows?: number;
};

const resolve = ({ keys, maxRows = 5000 }: ResolveArgs) =>
  resolveGroupGuardRails({
    capabilities: CAPABILITIES,
    grouping: 'flat',
    keys,
    maxRows,
  });

describe('resolveGroupGuardRails', () => {
  it('reports the bound and the caller ceiling for an ordinary grouping', () => {
    expect(resolve({ keys: ['country'] })).toEqual({
      estimate: { kind: 'known', rows: 60 },
      rowLimit: { limit: 5000 },
    });
  });

  it('says nothing about a bound under the warn threshold', () => {
    expect(resolve({ keys: ['city'] })).toEqual({
      estimate: { kind: 'known', rows: 900 },
      rowLimit: { limit: 5000 },
    });
  });

  it('warns without refusing between the two thresholds', () => {
    expect(resolve({ keys: ['region', 'city'] })).toEqual({
      estimate: { kind: 'known', rows: 10_800 },
      rowLimit: { limit: 5000 },
      warning: {
        estimatedRows: 10_800,
        kind: 'estimate-above-warn-threshold',
      },
    });
  });

  it('refuses the product of two wide keys', () => {
    expect(() => resolve({ keys: ['country', 'city'] })).toThrow(
      /Column "city"/,
    );
  });

  it('warns and installs the backstop when statistics are missing', () => {
    expect(resolve({ keys: ['unanalysed'], maxRows: 20_000 })).toEqual({
      estimate: { columns: ['unanalysed'], kind: 'unknown' },
      rowLimit: { backstopAt: 5001, limit: 5001 },
      warning: { columns: ['unanalysed'], kind: 'stats-unavailable' },
    });
  });
});
