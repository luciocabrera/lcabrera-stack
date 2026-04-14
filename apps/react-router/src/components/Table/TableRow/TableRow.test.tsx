// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableRow } from './TableRow.component';

type RenderInTableArgs = {
  readonly children: ReactNode;
};

const renderInTable = ({ children }: RenderInTableArgs) => {
  return render(
    <table>
      <tbody>{children}</tbody>
    </table>,
  );
};

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
});
