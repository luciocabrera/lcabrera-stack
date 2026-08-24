import { PERIOD_CAPABLE_TYPE_NAMES } from './group-query-builder.constants.ts';

type IsPeriodCapableTypeArgs = {
  readonly typeName: string;
  readonly typeNamespace: string;
};

/**
 * Whether a granularity may be applied to this column's type — a date or a timestamp, and
 * only in `pg_catalog`.
 * The same shape as `isIdentifierType` and for the same reason: type names are per-schema,
 * so a user-defined `app.date` reports `typname = 'date'` exactly like the built-in, and
 * matching on the bare name would hand `date_trunc` a composite.
 */
export const isPeriodCapableType = ({
  typeName,
  typeNamespace,
}: IsPeriodCapableTypeArgs) =>
  PERIOD_CAPABLE_TYPE_NAMES.has(`${typeNamespace}.${typeName}`);
