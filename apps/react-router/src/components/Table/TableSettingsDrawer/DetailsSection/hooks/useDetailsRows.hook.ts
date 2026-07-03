import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableTotalLoadedRows,
  useGetTableTotalRows,
} from '@/components/Table/contexts/TableData/data/selectors';
import { formatNumber } from '@/utils/formatters/formatNumber.util';

import type { DetailsRow } from '../DetailsSection.types';

import { buildCustomMetadataRows } from '../utils/buildCustomMetadataRows.util';
import { buildIdentityRows } from '../utils/buildIdentityRows.util';
import { buildRequiredRows } from '../utils/buildRequiredRows.util';
import { buildTechnicalRows } from '../utils/buildTechnicalRows.util';
import { resolveDetailsLocale } from '../utils/resolveDetailsLocale.util';
import { useDetailsConfigMeta } from './useDetailsConfigMeta.hook';
import { useDetailsIdentityMeta } from './useDetailsIdentityMeta.hook';

/**
 * Read table meta/data selectors and compose the ordered list of detail rows.
 * @returns The full list of rows rendered by DetailsSection.
 */
export const useDetailsRows = (): readonly DetailsRow[] => {
  const columns = useGetColumns();
  const totalLoadedRows = useGetTableTotalLoadedRows();
  const totalRows = useGetTableTotalRows();
  const { additionalMetadata, locale, schemaName, tableName, title } =
    useDetailsIdentityMeta();
  const config = useDetailsConfigMeta();

  const resolvedLocale = resolveDetailsLocale(locale);
  const formatInteger = (value: number): string =>
    formatNumber({ locale: resolvedLocale, maximumFractionDigits: 0, value });

  return [
    ...buildRequiredRows({
      columnCount: columns.length,
      formatInteger,
      totalLoadedRows,
      totalRows,
    }),
    ...buildIdentityRows({ schemaName, tableName, title }),
    ...buildTechnicalRows({ ...config, formatInteger }),
    ...buildCustomMetadataRows(additionalMetadata),
  ];
};
