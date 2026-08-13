// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { TableGroupLabel } from './TableGroupLabel.component';

const summary = (
  overrides: Partial<TableGroupRowSummary> = {},
): TableGroupRowSummary => ({
  aggregates: [],
  count: 12,
  isSubtotal: false,
  path: [{ columnKey: 'shipping_country', label: 'Spain' }],
  ...overrides,
});

describe('TableGroupLabel', () => {
  afterEach(cleanup);

  it('shows the innermost level and how many rows it covers', () => {
    render(<TableGroupLabel summary={summary()} />);

    expect(screen.getByText('Spain')).toBeTruthy();
    expect(screen.getByText('(12)')).toBeTruthy();
  });

  it('keeps the label on one line, whatever its length', () => {
    // Not a style preference: `TableRow` clamps min/max height to the store's
    // rowHeight, so a wrapped label is not a taller row — it is a clipped one,
    // and <tbody>'s declared height stops matching what is painted (ADR-065).
    render(
      <TableGroupLabel
        summary={summary({
          path: [
            { columnKey: 'city', label: 'a very long group label '.repeat(8) },
          ],
        })}
      />,
    );

    const label = screen.getByTestId('table-group-label');
    const text = label.querySelector('[title]');

    expect(text?.getAttribute('title')).toContain('a very long group label');
    // The truncation is visible rather than silent: an ellipsized label tells
    // the reader something was cut, where a clipped row does not.
    expect(label.querySelectorAll('br')).toHaveLength(0);
  });

  it('indents one step per level, so a level reads off the row', () => {
    render(
      <TableGroupLabel
        summary={summary({
          path: [
            { columnKey: 'region', label: 'EMEA' },
            { columnKey: 'shipping_country', label: 'Spain' },
          ],
        })}
      />,
    );

    // StyleX resolves dynamic values to inline custom properties in jsdom, so
    // the indentation arrives as the only pixel value on the element.
    expect(
      screen.getByTestId('table-group-label').getAttribute('style'),
    ).toContain('14px');
  });

  it('renders a subtotal as a total of its own level, unindented', () => {
    render(
      <TableGroupLabel
        summary={summary({
          isSubtotal: true,
          path: [{ columnKey: 'region', label: 'EMEA' }],
        })}
      />,
    );

    expect(screen.getByText('EMEA total')).toBeTruthy();
    expect(
      screen.getByTestId('table-group-label').getAttribute('style') ?? '',
    ).toContain('0px');
  });

  it('names the grand total, which no key identifies', () => {
    render(
      <TableGroupLabel summary={summary({ isSubtotal: true, path: [] })} />,
    );

    expect(screen.getByText('Grand total')).toBeTruthy();
  });
});
