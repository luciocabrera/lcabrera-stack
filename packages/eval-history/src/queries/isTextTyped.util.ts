import type { SchemaColumn } from './queries.types.ts';

import { TEXT_ARRAY_UDT_NAMES, TEXT_TYPES } from './queries.constants.ts';

export const isTextTyped = ({
  dataType,
  udtName,
}: Pick<SchemaColumn, 'dataType' | 'udtName'>) =>
  (TEXT_TYPES as readonly string[]).includes(dataType) ||
  (dataType === 'ARRAY' &&
    (TEXT_ARRAY_UDT_NAMES as readonly string[]).includes(udtName));
