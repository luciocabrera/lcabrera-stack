import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { resolveWidestGroupKey } from './resolve-widest-group-key.util.ts';

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
  role: 'dimension',
  typeName: 'text',
  ...(distinctEstimate !== undefined && { distinctEstimate }),
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  city: capability({ column: 'city', distinctEstimate: 900 }),
  country: capability({ column: 'country', distinctEstimate: 12 }),
  tie: capability({ column: 'tie', distinctEstimate: 900 }),
  unanalysed: capability({ column: 'unanalysed' }),
};

describe('resolveWidestGroupKey', () => {
  it('names the key contributing most to the bound', () => {
    expect(
      resolveWidestGroupKey({
        capabilities: CAPABILITIES,
        keys: ['country', 'city'],
      }),
    ).toEqual({ column: 'city', distinctEstimate: 900 });
  });

  it('keeps the earlier key on a tie, so a refusal is stable', () => {
    expect(
      resolveWidestGroupKey({
        capabilities: CAPABILITIES,
        keys: ['city', 'tie'],
      })?.column,
    ).toBe('city');
  });

  it('reads a key with no estimate as contributing nothing', () => {
    expect(
      resolveWidestGroupKey({
        capabilities: CAPABILITIES,
        keys: ['unanalysed', 'country'],
      }),
    ).toEqual({ column: 'country', distinctEstimate: 12 });
  });

  it('returns undefined rather than inventing a name for no keys', () => {
    expect(
      resolveWidestGroupKey({ capabilities: CAPABILITIES, keys: [] }),
    ).toBeUndefined();
  });
});
