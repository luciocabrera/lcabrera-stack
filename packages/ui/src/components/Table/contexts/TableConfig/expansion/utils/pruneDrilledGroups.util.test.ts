import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupExpansionState } from '#ui/components/Table/Table.types';

import { pruneDrilledGroups } from './pruneDrilledGroups.util';

const drilled = (): TableGroupExpansionState['drilledGroups'] =>
  new Map([
    ['region:Iberia', { rows: [{ id: 1 }], status: 'loaded' as const }],
  ]);

describe('pruneDrilledGroups', () => {
  it('discards every page when the rows have been re-read', () => {
    // A drilled page was fetched under the query the view was read with, so a
    // re-read invalidates it (ADR-079).
    expect(pruneDrilledGroups(drilled()).size).toBe(0);
  });

  it('discards a surviving group’s page too, which is the dangerous one', () => {
    // A group removed by a filter is obvious. One that survives keeps its
    // heading and changes its count, so a page kept under it looks correct and
    // is not — which is why this discards rather than pruning by path.
    const groups = new Map([
      ['region:Iberia', { rows: [{ id: 1 }], status: 'loaded' as const }],
      ['region:Nordics', { rows: [{ id: 2 }], status: 'loaded' as const }],
    ]);

    expect(pruneDrilledGroups(groups).size).toBe(0);
  });

  it('returns the same instance when there is nothing to discard', () => {
    // The caller skips its store write on reference equality, which is what
    // stops the effect that calls it from re-entering.
    const empty: TableGroupExpansionState['drilledGroups'] = new Map();

    expect(pruneDrilledGroups(empty)).toBe(empty);
  });

  it('returns a different instance when it did discard', () => {
    const groups = drilled();

    expect(pruneDrilledGroups(groups)).not.toBe(groups);
  });
});
