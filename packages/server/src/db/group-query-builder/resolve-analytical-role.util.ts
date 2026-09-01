import type { ColumnAnalyticalRole } from './group-query-builder.types.ts';

import { isIdentifierType } from './is-identifier-type.util.ts';

const ROLE_BY_TYPE_CATEGORY: Readonly<Record<string, ColumnAnalyticalRole>> = {
  B: 'dimension', // boolean
  D: 'dimension', // date/time
  E: 'dimension', // enum
  I: 'dimension', // inet and cidr — the category holds nothing else
  N: 'fact', // numeric, including money
  S: 'dimension', // string
  T: 'fact', // interval — sole member; `sum`/`avg` are what a duration wants
};

type ResolveAnalyticalRoleArgs = {
  readonly typeCategory: string;
  readonly typeName: string;
  readonly typeNamespace: string;
};

export const resolveAnalyticalRole = ({
  typeCategory,
  typeName,
  typeNamespace,
}: ResolveAnalyticalRoleArgs): ColumnAnalyticalRole =>
  isIdentifierType({ typeName, typeNamespace })
    ? 'dimension'
    : (ROLE_BY_TYPE_CATEGORY[typeCategory] ?? 'unsupported');
