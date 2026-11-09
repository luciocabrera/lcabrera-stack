import { within } from '@testing-library/react';

export const tableHeaders = (table: HTMLElement) =>
  within(table)
    .getAllByRole('columnheader')
    .map((header) => header.textContent);

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
