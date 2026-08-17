// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { TableGroupLabel } from './TableGroupLabel.component';

/**
 * The one-line contract, declared here independently of the component.
 *
 * StyleX compiles a declaration to an **atomic** class keyed by the property
 * and value, so the same three declarations compile to the same three classes
 * wherever they are written. Restating them here and asserting the rendered
 * element carries all three is therefore a real check on the shipped style: it
 * fails the moment one is dropped from `TableGroupLabel.stylex.ts`.
 *
 * Reading the component's own style object instead would prove nothing —
 * removing a property would change the expectation and the subject together.
 */
const oneLineContract = stylex.create({
  text: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

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

  it('shows the innermost level of the group', () => {
    render(<TableGroupLabel summary={summary()} />);

    expect(screen.getByText('Spain')).toBeTruthy();
  });

  it('does not print the row count beside the label', () => {
    // ADR-065 puts a measure in the column it aggregates, under that column's
    // header. A count printed here is the one measure aligned under nothing;
    // a route that wants it selects a `count` aggregate on a column instead.
    render(<TableGroupLabel summary={summary({ count: 12 })} />);

    expect(screen.queryByText('(12)')).toBeNull();
    expect(screen.getByTestId('table-group-label').textContent).toBe('Spain');
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

    // jsdom lays nothing out, so there is no geometry to measure and no
    // `<br>` to count — a CSS wrap emits neither. What is checkable is the
    // declared contract: `white-space: nowrap` is what stops the wrap, and
    // `text-overflow: ellipsis` with `overflow: hidden` is what makes the
    // truncation visible instead of silent.
    const required = (stylex.props(oneLineContract.text).className ?? '').split(
      ' ',
    );

    expect(required).not.toHaveLength(0);

    for (const className of required) {
      expect(text?.classList.contains(className)).toBe(true);
    }
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
