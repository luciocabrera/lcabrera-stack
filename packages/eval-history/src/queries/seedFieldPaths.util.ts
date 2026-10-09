import { freeStringPaths } from './freeStringPaths.util.ts';
import {
  ALLOWED_WHOLE_JSONB,
  JSONB_COLUMN_SCHEMAS,
  PUBLIC_FIELD_PATHS,
} from './queries.constants.ts';

export const seedFieldPaths = (column: keyof typeof JSONB_COLUMN_SCHEMAS) => {
  const wholeJsonb: readonly string[] = ALLOWED_WHOLE_JSONB;
  const fieldPaths: readonly string[] = PUBLIC_FIELD_PATHS;

  return wholeJsonb.includes(column)
    ? []
    : freeStringPaths({ schema: JSONB_COLUMN_SCHEMAS[column] }).filter(
        (path) => !fieldPaths.includes(`${column}.${path}`),
      );
};
