import { IDENTIFIER_TYPE_NAMES } from './group-query-builder.constants.ts';

type IsIdentifierTypeArgs = {
  readonly typeName: string;
  readonly typeNamespace: string;
};

/**
 * Whether a column's type is one of the named identifier exceptions to Gate 1's
 * category derivation (ADR-058, #599).
 *
 * It lives in its own file because two rules consult it and they must not drift:
 * `resolveAnalyticalRole` uses it to admit the type at all, and `refuseGroupKey`
 * uses it to hold that type to a fact's cardinality bar. Matching is
 * schema-qualified — a user-defined `app.uuid` is not `pg_catalog.uuid`.
 */
export const isIdentifierType = ({
  typeName,
  typeNamespace,
}: IsIdentifierTypeArgs) =>
  IDENTIFIER_TYPE_NAMES.has(`${typeNamespace}.${typeName}`);
