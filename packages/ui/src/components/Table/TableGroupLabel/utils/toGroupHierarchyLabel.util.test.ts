import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { toGroupHierarchyLabel } from './toGroupHierarchyLabel.util';

const summary = (overrides: Partial<TableGroupRowSummary>) =>
  toGroupHierarchyLabel({
    summary: {
      aggregates: [],
      count: 3,
      isSubtotal: false,
      path: [{ columnKey: 'shipping_country', label: 'EMEA' }],
      ...overrides,
    },
  });

describe('toGroupHierarchyLabel', () => {
  it('shows the innermost key value, not the whole path', () => {
    // Every level above it is already stated by the group row this one is
    // indented under — the argument for a hierarchy column over a banner.
    expect(
      summary({
        path: [
          { columnKey: 'region', label: 'EMEA' },
          { columnKey: 'shipping_country', label: 'Spain' },
        ],
      }).text,
    ).toBe('Spain');
  });

  it('indents by depth, one step per level below the first', () => {
    expect(summary({}).depth).toBe(0);
    expect(
      summary({
        path: [
          { columnKey: 'region', label: 'EMEA' },
          { columnKey: 'shipping_country', label: 'Spain' },
        ],
      }).depth,
    ).toBe(1);
  });

  it('states a subtotal as a total of the level it closes', () => {
    expect(summary({ isSubtotal: true }).text).toBe('EMEA total');
  });

  it('puts a subtotal one step shallower than the rows it totals', () => {
    // The discriminating pair, and the reason this is the carrier ADR-065
    // handed #570. A real NULL country and the subtotal across every country
    // produce the same label from the same column; the depth and the word are
    // what separate them.
    const realNull = summary({
      path: [
        { columnKey: 'region', label: 'EMEA' },
        { columnKey: 'shipping_country', label: '(empty)' },
      ],
    });
    const subtotal = summary({
      isSubtotal: true,
      path: [{ columnKey: 'region', label: 'EMEA' }],
    });

    expect(realNull.depth).toBe(1);
    expect(realNull.text).toBe('(empty)');
    expect(subtotal.depth).toBe(0);
    expect(subtotal.text).toBe('EMEA total');
  });

  it('names the grand total, which is keyed by nothing at all', () => {
    expect(summary({ isSubtotal: true, path: [] })).toStrictEqual({
      depth: 0,
      isSubtotal: true,
      text: 'Grand total',
    });
  });
});
