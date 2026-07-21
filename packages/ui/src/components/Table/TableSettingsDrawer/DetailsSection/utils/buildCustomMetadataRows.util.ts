import type { TableMetadataValue } from '@lcabrera/ui/components/Table/Table.types';

import type { DetailsRow } from '../DetailsSection.types';

import { formatMetadataLabel } from './formatMetadataLabel.util';
import { formatMetadataValue } from './formatMetadataValue.util';

/**
 * Build detail rows from the additional metadata map.
 * Entries with `null`/`undefined` values are omitted and keys are humanized.
 * @param additionalMetadata - The optional additional metadata map.
 * @returns The custom metadata detail rows.
 */
export const buildCustomMetadataRows = (
  additionalMetadata: Record<string, unknown> | undefined,
): readonly DetailsRow[] => {
  return Object.entries(additionalMetadata ?? {})
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({
      key: `metadata-${key}`,
      label: formatMetadataLabel(key),
      value: formatMetadataValue(value as TableMetadataValue),
    }));
};
