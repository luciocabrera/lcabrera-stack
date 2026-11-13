import { within } from '@testing-library/react';

export const tableHeaders = (table: HTMLElement) =>
  within(table)
    .getAllByRole('columnheader')
    .map(
      (header) =>
        within(header).queryByTestId('table-header-label')?.textContent ??
        header.textContent,
    );

export const tableCells = (table: HTMLElement) =>
  within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => ({
          className: cell.className,
          column: cell.dataset.columnKey,
          text: cell.textContent,
        })),
    );
