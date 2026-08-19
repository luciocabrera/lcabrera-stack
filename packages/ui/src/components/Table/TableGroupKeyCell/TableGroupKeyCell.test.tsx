// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { TableGroupKeyCell } from './TableGroupKeyCell.component';

vi.mock('#ui/components/Table/TableGroupDisclosure', () => ({
  TableGroupDisclosure: () => <span data-testid='disclosure' />,
}));

const GROUPING_KEYS = ['city', 'district'];

const summaryOf = (
  path: readonly (readonly [string, string])[],
): TableGroupRowSummary => ({
  aggregates: [],
  count: 1,
  isSubtotal: false,
  path: path.map(([columnKey, label]) => ({ columnKey, label, value: label })),
});

const FULL_PATH = [
  ['city', 'Paris'],
  ['district', 'Marais'],
] as const;

type RenderCellArgs = {
  readonly columnKey: string;
  readonly isCarried?: boolean;
};

const renderCell = ({ columnKey, isCarried = false }: RenderCellArgs) =>
  render(
    <TableGroupKeyCell
      columnKey={columnKey}
      disclosure={{ hasChildren: true, isDrillable: false, isExpanded: true }}
      groupingKeys={GROUPING_KEYS}
      isCarried={isCarried}
      summary={summaryOf(FULL_PATH)}
    />,
  );

describe('TableGroupKeyCell', () => {
  afterEach(cleanup);

  it("renders the key's value in its own column", () => {
    renderCell({ columnKey: 'city' });

    expect(screen.getByTestId('table-group-key-cell').textContent).toBe(
      'Paris',
    );
  });

  it('leads the innermost level with the disclosure, and nothing else', () => {
    renderCell({ columnKey: 'district' });
    expect(screen.getByTestId('disclosure')).toBeTruthy();

    cleanup();

    renderCell({ columnKey: 'city' });
    expect(screen.queryByTestId('disclosure')).toBeNull();
  });

  it('renders a carried level as visually-hidden text, not as an empty cell', () => {
    // An empty cell announces as empty, so an ancestor that is only implied
    // would be announced nowhere at all (ADR-080).
    renderCell({ columnKey: 'city', isCarried: true });

    const carried = screen.getByTestId('table-group-key-carried');

    expect(carried.textContent).toBe('Paris');
    expect(screen.queryByTestId('table-group-key-cell')).toBeNull();
  });

  it('renders nothing at all for a level the row does not carry', () => {
    const { container } = render(
      <TableGroupKeyCell
        columnKey='district'
        disclosure={undefined}
        groupingKeys={GROUPING_KEYS}
        isCarried={false}
        summary={summaryOf([['city', 'Paris']])}
      />,
    );

    expect(container.textContent).toBe('');
    expect(container.children).toHaveLength(0);
  });
});
