import * as stylex from '@stylexjs/stylex';

import type { TableMetadataValue } from '@/components/Table/Table.types';

import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@/components/SidePanel';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableAdditionalMetadata,
  useGetTableDensity,
  useGetTableEnablePrefetch,
  useGetTableInitialPageSize,
  useGetTableIsBordered,
  useGetTableIsStriped,
  useGetTableLoadMorePageSize,
  useGetTableLocale,
  useGetTableOverscan,
  useGetTablePersistenceKey,
  useGetTableRowHeight,
  useGetTableSchemaName,
  useGetTableTableName,
  useGetTableThreshold,
  useGetTableTitle,
} from '@/components/Table/contexts/TableConfig/meta/selectors';
import {
  useGetTableTotalLoadedRows,
  useGetTableTotalRows,
} from '@/components/Table/contexts/TableData/data/selectors';
import { formatNumber } from '@/utils/formatters/formatNumber.util';

import type { DetailsRow, DetailsSectionProps } from './DetailsSection.types';

import { busyStyles, styles } from './DetailsSection.stylex';

const formatMetadataLabel = (rawKey: string): string => {
  const normalized = rawKey
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatMetadataValue = (value: TableMetadataValue): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return formatNumber({ maximumFractionDigits: 0, value });
  }

  return String(value);
};

export const DetailsSection = ({ isBussy = false }: DetailsSectionProps) => {
  const columns = useGetColumns();
  const totalLoadedRows = useGetTableTotalLoadedRows();
  const totalRows = useGetTableTotalRows();

  const additionalMetadata = useGetTableAdditionalMetadata();
  const density = useGetTableDensity();
  const enablePrefetch = useGetTableEnablePrefetch();
  const initialPageSize = useGetTableInitialPageSize();
  const isBordered = useGetTableIsBordered();
  const isStriped = useGetTableIsStriped();
  const locale = useGetTableLocale();
  const loadMorePageSize = useGetTableLoadMorePageSize();
  const overscan = useGetTableOverscan();
  const persistenceKey = useGetTablePersistenceKey();
  const rowHeight = useGetTableRowHeight();
  const schemaName = useGetTableSchemaName();
  const tableName = useGetTableTableName();
  const threshold = useGetTableThreshold();
  const title = useGetTableTitle();

  const resolvedLocale =
    locale ??
    (typeof navigator === 'undefined' ? undefined : navigator.language);

  const formatInteger = (value: number): string =>
    formatNumber({ locale: resolvedLocale, maximumFractionDigits: 0, value });

  const requiredRows: readonly DetailsRow[] = [
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
      value: formatInteger(columns.length),
    },
  ];

  const optionalIdentityRows = [
    title
      ? {
          key: 'title',
          label: 'Title',
          value: title,
        }
      : undefined,
    tableName
      ? {
          key: 'table-name',
          label: 'Table Name',
          value: tableName,
        }
      : undefined,
    schemaName
      ? {
          key: 'schema-name',
          label: 'Schema Name',
          value: schemaName,
        }
      : undefined,
  ].filter((row): row is DetailsRow => row !== undefined);

  const technicalRows: readonly DetailsRow[] = [
    {
      key: 'density',
      label: 'Density',
      value: density,
    },
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
    {
      key: 'row-height',
      label: 'Row Height',
      value: formatInteger(rowHeight),
    },
    {
      key: 'overscan',
      label: 'Overscan',
      value: formatInteger(overscan),
    },
    {
      key: 'threshold',
      label: 'Threshold',
      value: formatInteger(threshold),
    },
    {
      key: 'persistence-key',
      label: 'Persistence Key',
      value: persistenceKey,
    },
  ].filter((row) => row.value !== '');

  const customMetadataRows = Object.entries(additionalMetadata ?? {})
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({
      key: `metadata-${key}`,
      label: formatMetadataLabel(key),
      value: formatMetadataValue(value as TableMetadataValue),
    }));

  const rows = [
    ...requiredRows,
    ...optionalIdentityRows,
    ...technicalRows,
    ...customMetadataRows,
  ];

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader title='Table Details' />
        <dl {...stylex.props(styles.rows)}>
          {rows.map((row) => (
            <div key={row.key} {...stylex.props(styles.row)}>
              {isBussy && (
                <div {...stylex.props(busyStyles.overlay)}>
                  <div {...stylex.props(busyStyles.wave)} />
                </div>
              )}
              <dt {...stylex.props(styles.label)}>{row.label}</dt>
              <dd {...stylex.props(styles.value)}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </SidePanelSection>
    </SidePanelSectionMain>
  );
};
