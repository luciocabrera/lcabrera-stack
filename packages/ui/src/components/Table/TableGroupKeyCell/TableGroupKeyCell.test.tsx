// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableGroupLevelDisclosure } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveGroupLevelDisclosures.util';
import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { TableGroupKeyCell } from './TableGroupKeyCell.component';

// The box is always rendered so labels line up down a key column; what varies
// is whether a control was handed to it, which is what these assertions read.
vi.mock('#ui/components/Table/TableGroupDisclosure', () => ({
  TableGroupDisclosure: ({
    disclosure,
    path,
  }: {
    readonly disclosure: unknown;
    readonly path: readonly { readonly label: string }[];
  }) => (
    <span
      data-controls={path.map(({ label }) => label).join('/')}
      data-openable={String(disclosure !== undefined)}
      data-testid='disclosure'
    />
  ),
}));

// Rendered as its no-path behaviour — the bare text. Which route serves a
// group's rows is meta this cell reads from the store, and these cases are
// about which control the cell draws; the link is covered where a grid is
// actually mounted, in `Table.groupDetails.test.tsx`.
vi.mock('./TableGroupKeyLink', () => ({
  TableGroupKeyLink: ({ text }: { readonly text: string }) => text,
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
  readonly levelDisclosures?: readonly TableGroupLevelDisclosure[];
};

const NO_LEVELS: readonly TableGroupLevelDisclosure[] = [];

const renderCell = ({
  columnKey,
  isCarried = false,
  levelDisclosures = NO_LEVELS,
}: RenderCellArgs) =>
  render(
    <TableGroupKeyCell
      columnKey={columnKey}
      disclosure={{
        hasChildren: true,
        isExpanded: true,
        levelDisclosures,
      }}
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

  it('reserves the chevron box on every drawn key cell, control or not', () => {
    renderCell({ columnKey: 'city' });

    expect(screen.getByTestId('disclosure').dataset.openable).toBe('false');
  });

  it('leads a foldable level with a control, in that level’s own column', () => {
    renderCell({
      columnKey: 'city',
      levelDisclosures: [
        {
          columnKey: 'city',
          isExpanded: true,
          path: [{ columnKey: 'city', label: 'Paris', value: 'Paris' }],
        },
      ],
    });

    const disclosure = screen.getByTestId('disclosure');

    expect(disclosure.dataset.openable).toBe('true');
    expect(disclosure.dataset.controls).toBe('Paris');
  });

  it('leaves a level with no entry uncontrolled, innermost included', () => {
    renderCell({ columnKey: 'district' });

    expect(screen.getByTestId('disclosure').dataset.openable).toBe('false');
  });

  it('renders a carried level as visually-hidden text, not as an empty cell', () => {
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
