import type { TableMetadataValue } from '#ui/components/Table/Table.types';

import type { DetailsRow } from '../DetailsSection.types';

import { formatMetadataLabel } from './formatMetadataLabel.util';
import { formatMetadataValue } from './formatMetadataValue.util';

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
