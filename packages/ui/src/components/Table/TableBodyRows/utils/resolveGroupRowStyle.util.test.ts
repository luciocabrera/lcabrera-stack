import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { tableBodyRowsStyles } from '../TableBodyRows.stylex';
import { resolveGroupRowStyle } from './resolveGroupRowStyle.util';

const summary = (
  overrides: Partial<TableGroupRowSummary>,
): TableGroupRowSummary => ({
  aggregates: [],
  count: 4,
  isSubtotal: false,
  path: [{ columnKey: 'region', label: 'EMEA' }],
  ...overrides,
});

describe('resolveGroupRowStyle', () => {
  it('leaves a detail row to the striping', () => {
    expect(resolveGroupRowStyle(undefined)).toBeUndefined();
  });

  it('gives an ordinary group row the group ground', () => {
    expect(resolveGroupRowStyle(summary({}))).toBe(
      tableBodyRowsStyles.groupRow,
    );
  });

  it('gives a subtotal its own ground', () => {
    expect(resolveGroupRowStyle(summary({ isSubtotal: true }))).toBe(
      tableBodyRowsStyles.subtotalRow,
    );
  });

  it('reads the grand total as a grand total, not as one more subtotal', () => {
    // The discriminating case for the ordering. A grand total rolls up every
    // key, so `isSubtotal` is true on it as well — asking that question first
    // would paint the end of the table as a level total. The empty path is
    // what separates them.
    expect(resolveGroupRowStyle(summary({ isSubtotal: true, path: [] }))).toBe(
      tableBodyRowsStyles.grandTotalRow,
    );
  });

  it('reads an empty path as the grand total even when nothing rolled up', () => {
    // A flat read never sets a grouping bit, so a keyless row still arrives
    // with `isSubtotal: false`. The path is the authority.
    expect(resolveGroupRowStyle(summary({ path: [] }))).toBe(
      tableBodyRowsStyles.grandTotalRow,
    );
  });
});
