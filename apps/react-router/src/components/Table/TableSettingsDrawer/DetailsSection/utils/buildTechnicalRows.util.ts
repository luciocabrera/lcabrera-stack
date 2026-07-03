import type { DetailsRow } from '../DetailsSection.types';

import { formatMetadataValue } from './formatMetadataValue.util';

type BuildTechnicalRowsArgs = {
  readonly density: string;
  readonly enablePrefetch: boolean;
  readonly formatInteger: (value: number) => string;
  readonly initialPageSize: number;
  readonly isBordered: boolean;
  readonly isStriped: boolean;
  readonly loadMorePageSize: number;
  readonly overscan: number;
  readonly persistenceKey: string;
  readonly rowHeight: number;
  readonly threshold: number;
};

/**
 * Build the technical configuration rows, dropping any with an empty value.
 * @param args - Table meta configuration values plus the integer formatter.
 * @returns The technical detail rows that have a value.
 */
export const buildTechnicalRows = ({
  density,
  enablePrefetch,
  formatInteger,
  initialPageSize,
  isBordered,
  isStriped,
  loadMorePageSize,
  overscan,
  persistenceKey,
  rowHeight,
  threshold,
}: BuildTechnicalRowsArgs): readonly DetailsRow[] => {
  const rows: readonly DetailsRow[] = [
    { key: 'density', label: 'Density', value: density },
    {
      key: 'is-bordered',
      label: 'Bordered',
      value: formatMetadataValue(isBordered),
    },
    {
      key: 'is-striped',
      label: 'Striped',
      value: formatMetadataValue(isStriped),
    },
    {
      key: 'enable-prefetch',
      label: 'Prefetch Enabled',
      value: formatMetadataValue(enablePrefetch),
    },
    {
      key: 'initial-page-size',
      label: 'Initial Page Size',
      value: formatInteger(initialPageSize),
    },
    {
      key: 'load-more-page-size',
      label: 'Load More Page Size',
      value: formatInteger(loadMorePageSize),
    },
    { key: 'row-height', label: 'Row Height', value: formatInteger(rowHeight) },
    { key: 'overscan', label: 'Overscan', value: formatInteger(overscan) },
    { key: 'threshold', label: 'Threshold', value: formatInteger(threshold) },
    {
      key: 'persistence-key',
      label: 'Persistence Key',
      value: persistenceKey,
    },
  ];

  return rows.filter((row) => row.value !== '');
};
