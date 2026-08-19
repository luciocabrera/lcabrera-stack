import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { isDrillableGroupPath } from './isDrillableGroupPath.util';

const keyOf = (columnKey: string): TableGroupKeyValue => ({
  columnKey,
  label: columnKey,
  value: columnKey,
});

const GROUPING_KEYS = ['region', 'status'];

type Args = {
  readonly canDrill?: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

const isDrillable = ({ canDrill = true, path }: Args) =>
  isDrillableGroupPath({ canDrill, groupingKeys: GROUPING_KEYS, path });

describe('isDrillableGroupPath', () => {
  it('accepts a complete grouping set', () => {
    expect(isDrillable({ path: [keyOf('region'), keyOf('status')] })).toBe(
      true,
    );
  });

  it('refuses an outer level, whose children are group rows already in memory', () => {
    expect(isDrillable({ path: [keyOf('region')] })).toBe(false);
  });

  it('refuses a rollup subtotal without testing for one', () => {
    // A subtotal is defined by having rolled a key up, so its path is always
    // shorter than the key list — the length test rules it out as a
    // consequence.
    expect(isDrillable({ path: [keyOf('region')] })).toBe(false);
  });

  it('refuses the grand total, which totals the whole table', () => {
    expect(isDrillable({ path: [] })).toBe(false);
  });

  it('refuses everything when the route serves no drilled page', () => {
    // ADR-063: the capability is the route's declaration, and it is not a
    // property the rows can supply.
    expect(
      isDrillable({
        canDrill: false,
        path: [keyOf('region'), keyOf('status')],
      }),
    ).toBe(false);
  });

  it('refuses an ungrouped result, where both lengths are zero', () => {
    // The empty-path check is not redundant with the comparison: without it a
    // summary-carrying row in an ungrouped result reports as drillable.
    expect(
      isDrillableGroupPath({ canDrill: true, groupingKeys: [], path: [] }),
    ).toBe(false);
  });
});
