import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { isDrillableGroupRow } from './isDrillableGroupRow.util';

const GROUPING_KEYS = ['status', 'category'];

type SummaryArgs = {
  readonly isSubtotal?: boolean;
  readonly path: readonly string[];
};

const summaryOf = ({
  isSubtotal = false,
  path,
}: SummaryArgs): TableGroupRowSummary => ({
  aggregates: [],
  count: 3,
  isSubtotal,
  path: path.map((columnKey) => ({ columnKey, label: 'x', value: 'x' })),
});

type DrillableArgs = {
  readonly canDrill?: boolean;
  readonly groupingKeys?: readonly string[];
  readonly summary: TableGroupRowSummary | undefined;
};

const drillable = ({
  canDrill = true,
  groupingKeys = GROUPING_KEYS,
  summary,
}: DrillableArgs) => isDrillableGroupRow({ canDrill, groupingKeys, summary });

describe('isDrillableGroupRow', () => {
  it('drills a leaf group whose path names every applied key', () => {
    expect(
      drillable({ summary: summaryOf({ path: ['status', 'category'] }) }),
    ).toBe(true);
  });

  it('refuses an outer level, whose children are group rows already in memory', () => {
    expect(drillable({ summary: summaryOf({ path: ['status'] }) })).toBe(false);
  });

  it('refuses a subtotal, whose children are levels rather than rows', () => {
    expect(
      drillable({
        summary: summaryOf({ isSubtotal: true, path: ['status', 'category'] }),
      }),
    ).toBe(false);
  });

  it('refuses the grand total, which is keyed by nothing', () => {
    expect(
      drillable({ summary: summaryOf({ isSubtotal: true, path: [] }) }),
    ).toBe(false);
  });

  it('refuses a summary-carrying row when nothing is grouped', () => {
    // Both lengths are zero here, so the length comparison alone would report
    // this drillable — the non-empty check is what rules it out.
    expect(
      drillable({ groupingKeys: [], summary: summaryOf({ path: [] }) }),
    ).toBe(false);
  });

  it('refuses a detail row', () => {
    expect(drillable({ summary: undefined })).toBe(false);
  });

  it('refuses everything when the route serves no drilled page', () => {
    // A chevron whose every use fails is worse than no chevron (ADR-063).
    expect(
      drillable({
        canDrill: false,
        summary: summaryOf({ path: ['status', 'category'] }),
      }),
    ).toBe(false);
  });
});
