import type {
  ColumnReference,
  ReadScope,
} from '../query-builder/query-builder.types.ts';
import type {
  ColumnGroupingCapability,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { buildProjectedColumn } from '../query-builder/build-projected-column.util.ts';
import { resolveColumnReference } from '../query-builder/resolve-column-reference.util.ts';
import { resolveGroupKeyExpression } from './resolve-group-key-expression.util.ts';

type ResolveGroupKeyColumnsArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly keys: readonly ColumnReference[];
  readonly periods?: Readonly<Record<string, GroupKeyPeriod>>;
  readonly scope?: ReadScope;
};

export const resolveGroupKeyColumns = ({
  allowedColumns,
  capabilities,
  keys,
  periods,
  scope,
}: ResolveGroupKeyColumnsArgs) =>
  keys.map((reference) => {
    const column = resolveColumnReference({
      allowedColumns,
      reference,
      scope,
    });
    const period = periods?.[column.name];
    const expression = resolveGroupKeyExpression({
      columnSql: column.sql,
      key: column.name,
      period,
      typeName: capabilities[column.name]?.typeName,
    });
    const projection = buildProjectedColumn({
      isAliased: column.isJoined || period !== undefined,
      name: column.name,
      sql: expression,
    });

    return { expression, name: column.name, projection };
  });
