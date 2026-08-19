// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableDrillRowMarker } from '#ui/components/Table/Table.types';

import { resolveDrillCellChildren } from './resolveDrillCellChildren.util';

vi.mock('#ui/components/Table/TableDrillRowCell', () => ({
  TableDrillRowCell: ({ marker }: { readonly marker: TableDrillRowMarker }) => (
    <span data-testid='drill-cell'>{marker.kind}</span>
  ),
}));

const GROUPING_KEYS = ['region', 'status'];

const MARKER: TableDrillRowMarker = {
  kind: 'handoff',
  path: [{ columnKey: 'region', label: 'Iberia', value: 'Iberia' }],
  pathKey: 'region:Iberia',
  shortfall: 7,
};

type RenderCellArgs = {
  readonly columnKey: string;
  readonly groupingKeys?: readonly string[];
};

const renderCell = ({
  columnKey,
  groupingKeys = GROUPING_KEYS,
}: RenderCellArgs) =>
  render(
    <>
      {resolveDrillCellChildren({ columnKey, groupingKeys, marker: MARKER })}
    </>,
  );

describe('resolveDrillCellChildren', () => {
  afterEach(cleanup);

  it('puts the chrome in the first group-key column', () => {
    // The key columns are hoisted to the head of the order (ADR-080), so the
    // first of them is the grid's leftmost cell — under the group heading
    // these rows belong to.
    renderCell({ columnKey: 'region' });

    expect(screen.getByTestId('drill-cell').textContent).toBe('handoff');
  });

  it('leaves every other group-key column empty', () => {
    renderCell({ columnKey: 'status' });

    expect(screen.queryByTestId('drill-cell')).toBeNull();
  });

  it('leaves ordinary data columns empty', () => {
    // Nothing spans: a `colSpan` would give this row a different gridcell count
    // from every other row, which `role="grid"` forbids and the focus model's
    // column addressing assumes (ADR-062, ADR-065).
    renderCell({ columnKey: 'amount' });

    expect(screen.queryByTestId('drill-cell')).toBeNull();
  });

  it('fills nothing when there are no group keys', () => {
    renderCell({ columnKey: 'region', groupingKeys: [] });

    expect(screen.queryByTestId('drill-cell')).toBeNull();
  });
});
