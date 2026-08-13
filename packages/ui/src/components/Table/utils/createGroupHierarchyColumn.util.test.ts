import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { TABLE_GROUP_HIERARCHY_COLUMN_KEY } from '../Table.constants';
import { createGroupHierarchyColumn } from './createGroupHierarchyColumn.util';
import { resolveColumnCapabilities } from './resolveColumnCapabilities.util';

type Row = { readonly country: string; readonly status: string };

const columns: TableColumn<Row>[] = [
  { key: 'status', label: 'Status' },
  { key: 'country', label: 'Country' },
];

const create = (groupingKeys: readonly string[]) =>
  createGroupHierarchyColumn<Row>({ columns, groupingKeys });

describe('createGroupHierarchyColumn', () => {
  it('is keyed by the grid-owned key, whatever the grouping', () => {
    expect(create(['status']).key).toBe(TABLE_GROUP_HIERARCHY_COLUMN_KEY);
  });

  it('labels itself with the group keys, in nesting order', () => {
    // The banner it replaces stated `<column>: <value>` per key inline. The
    // header is where that context now lives, and it is also what tells a
    // reader which data columns are blanked on their detail rows (ADR-065).
    expect(create(['status', 'country']).label).toBe('Status › Country');
  });

  it('reads the human label from the column, not the key', () => {
    expect(create(['country']).label).toBe('Country');
  });

  it('falls back to the key when no column declares it', () => {
    // The honest answer for a URL naming a column this route does not render —
    // the same fallback a group summary's own labels take.
    expect(create(['region']).label).toBe('region');
  });

  it('withholds every capability a user could act with', () => {
    // It is not the consumer's column, so there is nothing about it a user's
    // layout state should be able to say.
    expect(resolveColumnCapabilities(create(['status']))).toStrictEqual({
      isFilterable: false,
      isGroupable: false,
      isResizable: false,
      isSortable: false,
      isStatic: true,
    });
  });

  it('keeps its header visible, because the label is the point', () => {
    expect(create(['status']).isHeaderHidden).toBeUndefined();
  });
});
