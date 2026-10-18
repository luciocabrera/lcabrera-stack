import type { EvalsRole, PrivilegeCheck, RoleGrant } from './migrate.types.ts';

const SCHEMA_TARGET = /^schema (\w+)$/;
const TABLES_TARGET = /^all tables in schema (\w+)$/;
const TABLE_TARGET = /^table (\w+)\.(\w+)$/;

const checkTarget = (on: string) => {
  const schema = SCHEMA_TARGET.exec(on)?.[1];

  if (schema) {
    return { kind: 'schema', schema } as const;
  }

  const tablesSchema = TABLES_TARGET.exec(on)?.[1];

  if (tablesSchema) {
    return { kind: 'tables', schema: tablesSchema } as const;
  }

  const [, tableSchema, table] = TABLE_TARGET.exec(on) ?? [];

  if (tableSchema && table) {
    return { kind: 'table', schema: tableSchema, table } as const;
  }

  throw new Error(
    `evals:migrate: cannot check a grant on "${on}"; only "schema <name>", "all tables in schema <name>" and "table <schema>.<name>" are checked`,
  );
};

const privilegesOf = ({ privileges }: RoleGrant) =>
  privileges
    .split(',')
    .map((privilege) => privilege.trim())
    .filter((privilege) => privilege.length > 0);

export const privilegeChecks = ({ grants }: EvalsRole) =>
  grants.flatMap<PrivilegeCheck>((grant) => {
    const target = checkTarget(grant.on);
    const { columns } = grant;

    if (columns === undefined || target.kind !== 'table') {
      return privilegesOf(grant).map((privilege) => ({
        ...target,
        privilege,
      }));
    }

    return privilegesOf(grant).flatMap((privilege) =>
      columns.map((column) => ({
        ...target,
        column,
        kind: 'column',
        privilege,
      })),
    );
  });
