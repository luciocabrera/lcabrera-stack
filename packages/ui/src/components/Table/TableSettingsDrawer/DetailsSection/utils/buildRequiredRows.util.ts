import type { DetailsRow } from '../DetailsSection.types';

type BuildRequiredRowsArgs = {
  readonly columnCount: number;
  readonly formatInteger: (value: number) => string;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

/**
 * Build the always-visible required metric rows.
 * @param args - Totals, column count, and integer formatter.
 * @returns The required detail rows.
 */
export const buildRequiredRows = ({
  columnCount,
  formatInteger,
  totalLoadedRows,
  totalRows,
}: BuildRequiredRowsArgs): readonly DetailsRow[] => {
  return [
    {
      key: 'total-records',
      label: 'Total Records',
      value: formatInteger(totalRows),
    },
    {
      key: 'total-loaded',
      label: 'Total Loaded',
      value: formatInteger(totalLoadedRows),
    },
    {
      key: 'number-of-columns',
      label: 'Number of Columns',
      value: formatInteger(columnCount),
    },
  ];
};
