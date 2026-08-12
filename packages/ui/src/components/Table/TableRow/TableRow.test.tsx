// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { DEFAULT_ROW_HEIGHT } from '#ui/components/Table/Table.constants';

import { TableRow } from './TableRow.component';

type RenderInTableArgs = {
  readonly children: ReactNode;
  readonly rowHeight?: number;
};

const renderInTable = ({ children, rowHeight }: RenderInTableArgs) => {
  return render(
    <TableConfigProvider
      columnsState={{ columns: [] }}
      metaState={{ rowHeight }}
    >
      <table>
        <tbody>{children}</tbody>
      </table>
    </TableConfigProvider>,
  );
};

/**
 * StyleX resolves to atomic classes against a stylesheet jsdom never loads, so
 * `getComputedStyle` reports `auto` here. Dynamic styles do reach the DOM as
 * inline custom properties, which is what these assertions read.
 */
const getInlineStyle = (element: HTMLElement) =>
  element.getAttribute('style') ?? '';

describe('TableRow', () => {
  it('renders children inside a table row element', () => {
    renderInTable({
      children: (
        <TableRow>
          <td>Revenue</td>
        </TableRow>
      ),
    });

    const cell = screen.getByText('Revenue');
    const row = cell.closest('tr');

    expect(row).not.toBeNull();
    expect(row?.tagName).toBe('TR');
  });

  it('forwards native row attributes', () => {
    renderInTable({
      children: (
        <TableRow title='summary-row'>
          <td>Summary</td>
        </TableRow>
      ),
    });

    const row = screen.getByTitle('summary-row');
    expect(row.tagName).toBe('TR');
  });

  it('sizes the row from the configured rowHeight', () => {
    // TableBody sizes <tbody> as totalRows × rowHeight and derives the
    // virtualization spacers from the same number. A row painted at any other
    // height desynchronizes the body from its contents, which shifts rows as
    // the virtualization window moves.
    renderInTable({
      children: (
        <TableRow title='tall-row'>
          <td>Tall</td>
        </TableRow>
      ),
      rowHeight: 48,
    });

    expect(getInlineStyle(screen.getByTitle('tall-row'))).toContain('48px');
  });

  it('falls back to the default row height', () => {
    renderInTable({
      children: (
        <TableRow title='default-row'>
          <td>Default</td>
        </TableRow>
      ),
    });

    expect(getInlineStyle(screen.getByTitle('default-row'))).toContain(
      `${DEFAULT_ROW_HEIGHT}px`,
    );
  });

  it('sizes the header row from the same rowHeight as body rows', () => {
    renderInTable({
      children: (
        <TableRow isHeader title='header-row'>
          <td>Header</td>
        </TableRow>
      ),
      rowHeight: 48,
    });

    expect(getInlineStyle(screen.getByTitle('header-row'))).toContain('48px');
  });
  it('declares role=row, because the flex display removed the implicit one', () => {
    // The `role` ATTRIBUTE, not a `getByRole('row')` query. Testing Library
    // resolves implicit roles and `<tr>` implicitly maps to `row`, so a role
    // query returns this same element with the attribute deleted — the test
    // would pass for a reason that has nothing to do with what it claims. In a
    // real browser the implicit role is gone, because `TableRow.stylex.ts` sets
    // `display: flex` (ADR-062).
    const { container } = renderInTable({
      children: (
        <TableRow>
          <td>Revenue</td>
        </TableRow>
      ),
    });
    const row = container.querySelector('tr');

    expect(row?.tagName).toBe('TR');
    expect(row?.getAttribute('role')).toBe('row');
  });

  it('forwards a caller-supplied position in the grid', () => {
    // `aria-rowindex` is deliberately not defaulted here: it belongs to the row's
    // place in the dataset, not to being a row.
    const { container } = renderInTable({
      children: (
        <TableRow aria-rowindex={42}>
          <td>Revenue</td>
        </TableRow>
      ),
    });

    expect(container.querySelector('tr')?.getAttribute('aria-rowindex')).toBe(
      '42',
    );
  });
  it('keeps role=row when a caller passes a conflicting role', () => {
    // The role is the row's only source of semantics once CSS has stripped the
    // implicit one, so `{...rest}` must not be able to replace it. Revert the
    // spread order in TableRow.component.tsx and this is what fails.
    const { container } = renderInTable({
      children: (
        <TableRow role='presentation'>
          <td>Revenue</td>
        </TableRow>
      ),
    });

    expect(container.querySelector('tr')?.getAttribute('role')).toBe('row');
  });
});
