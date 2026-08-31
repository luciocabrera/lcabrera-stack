import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { resolveGroupLevelDisclosures } from './resolveGroupLevelDisclosures.util';

const KEY_COLUMNS = ['status', 'customerType', 'priority'];

const pathOf = (...labels: readonly string[]) =>
  labels.map((label, index) => ({
    columnKey: KEY_COLUMNS[index] ?? 'extra',
    label,
    value: label,
  }));

type SummaryOfArgs = {
  readonly isSubtotal?: boolean;
  readonly path: ReturnType<typeof pathOf>;
};

const summaryOf = ({
  isSubtotal = false,
  path,
}: SummaryOfArgs): TableGroupRowSummary => ({
  aggregates: [],
  count: 1,
  isSubtotal,
  path,
});

const CANCELLED = pathOf('Cancelled');
const CANCELLED_BUSINESS = pathOf('Cancelled', 'Business');
const CANCELLED_BUSINESS_CRITICAL = pathOf('Cancelled', 'Business', 'Critical');

const CANCELLED_KEY = resolveGroupPathKey(CANCELLED);
const CANCELLED_BUSINESS_KEY = resolveGroupPathKey(CANCELLED_BUSINESS);
const CRITICAL_KEY = resolveGroupPathKey(CANCELLED_BUSINESS_CRITICAL);

const NO_COLLAPSE: ReadonlySet<string> = new Set();
const CANCELLED_COLLAPSED: ReadonlySet<string> = new Set([CANCELLED_KEY]);
const CANCELLED_HAS_ROWS: ReadonlySet<string> = new Set([CANCELLED_KEY]);
const BOTH_HAVE_ROWS: ReadonlySet<string> = new Set([
  CANCELLED_BUSINESS_KEY,
  CANCELLED_KEY,
]);

const columnsOf = (
  disclosures: ReturnType<typeof resolveGroupLevelDisclosures>,
) => disclosures.map(({ columnKey }) => columnKey);

describe('resolveGroupLevelDisclosures', () => {
  it('offers nothing on a detail row, which states no level of its own', () => {
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: CANCELLED_HAS_ROWS,
      pathKey: undefined,
      summary: undefined,
      toggledGroupPaths: NO_COLLAPSE,
    });

    expect(disclosures).toStrictEqual([]);
  });

  it('offers nothing on the grand total, which is keyed by nothing', () => {
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: CANCELLED_HAS_ROWS,
      pathKey: resolveGroupPathKey([]),
      summary: summaryOf({ isSubtotal: true, path: [] }),
      toggledGroupPaths: NO_COLLAPSE,
    });

    expect(disclosures).toStrictEqual([]);
  });

  it('offers an ancestor’s control from a row inside it', () => {
    // The defect (#802): the reader is looking at the first row of the
    // `Cancelled` block and the control has to be here, not on a subtotal ten
    // rows below.
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: BOTH_HAVE_ROWS,
      pathKey: CRITICAL_KEY,
      summary: summaryOf({ path: CANCELLED_BUSINESS_CRITICAL }),
      toggledGroupPaths: NO_COLLAPSE,
    });

    expect(columnsOf(disclosures)).toStrictEqual(['status', 'customerType']);
    // Each control names its own prefix, not the row's whole path — folding
    // `Cancelled` from here must not fold the row's own group instead.
    expect(disclosures[0]?.path).toStrictEqual(CANCELLED);
    expect(disclosures[1]?.path).toStrictEqual(CANCELLED_BUSINESS);
  });

  it('skips a level nothing sits under', () => {
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: CANCELLED_HAS_ROWS,
      pathKey: CANCELLED_BUSINESS_KEY,
      summary: summaryOf({ path: CANCELLED_BUSINESS }),
      toggledGroupPaths: NO_COLLAPSE,
    });

    expect(columnsOf(disclosures)).toStrictEqual(['status']);
  });

  it('keeps a group row folding itself when it precedes what it owns', () => {
    // The regression this guards: an ordinary grouped grid emits its group row
    // *before* its rows, so that row is the only one stating the level and
    // taking its control away would leave the grid unfoldable. Only a subtotal
    // trails its block, which is why `isSubtotal` and not identity decides it.
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: CANCELLED_HAS_ROWS,
      pathKey: CANCELLED_KEY,
      summary: summaryOf({ path: CANCELLED }),
      toggledGroupPaths: NO_COLLAPSE,
    });

    expect(columnsOf(disclosures)).toStrictEqual(['status']);
  });

  it('takes the control off an open subtotal, which trails its own block', () => {
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: CANCELLED_HAS_ROWS,
      pathKey: CANCELLED_KEY,
      summary: summaryOf({ isSubtotal: true, path: CANCELLED }),
      toggledGroupPaths: NO_COLLAPSE,
    });

    expect(disclosures).toStrictEqual([]);
  });

  it('returns the control to a collapsed subtotal, the only row left', () => {
    // Every row inside the group is hidden once it folds, so without this the
    // group could be closed and never reopened.
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: CANCELLED_HAS_ROWS,
      pathKey: CANCELLED_KEY,
      summary: summaryOf({ isSubtotal: true, path: CANCELLED }),
      toggledGroupPaths: CANCELLED_COLLAPSED,
    });

    expect(disclosures).toHaveLength(1);
    expect(disclosures[0]?.isExpanded).toBe(false);
  });

  it('states a collapsed ancestor as folded', () => {
    const disclosures = resolveGroupLevelDisclosures({
      defaultFold: 'expanded',
      foldableKeys: CANCELLED_HAS_ROWS,
      pathKey: CANCELLED_BUSINESS_KEY,
      summary: summaryOf({ path: CANCELLED_BUSINESS }),
      toggledGroupPaths: CANCELLED_COLLAPSED,
    });

    expect(disclosures).toHaveLength(1);
    expect(disclosures[0]?.isExpanded).toBe(false);
  });
});
