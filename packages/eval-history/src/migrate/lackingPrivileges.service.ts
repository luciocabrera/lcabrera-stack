import { z } from 'zod';

import type { EvalsRole, MigrationClient } from './migrate.types.ts';

import { privilegeChecks } from './privilegeChecks.util.ts';

type LackingPrivilegesArgs = {
  readonly client: MigrationClient;
  readonly role: EvalsRole;
};

const LACKING_SQL = `
select object, privilege from (
  select format('schema %I', checked.schema) as object, checked.privilege
  from unnest($2::text[], $3::text[]) as checked (schema, privilege)
  where not has_schema_privilege($1, checked.schema, checked.privilege)
  union all
  select format('table %I.%I', n.nspname, c.relname), checked.privilege
  from unnest($4::text[], $5::text[]) as checked (schema, privilege)
  join pg_namespace n on n.nspname = checked.schema
  join pg_class c on c.relnamespace = n.oid and c.relkind in ('r', 'p', 'v', 'm', 'f')
  where not has_table_privilege($1, c.oid, checked.privilege)
  union all
  select format('table %I.%I', checked.schema, checked.name), checked.privilege
  from unnest($6::text[], $7::text[], $8::text[]) as checked (schema, name, privilege)
  where not has_table_privilege($1, format('%I.%I', checked.schema, checked.name), checked.privilege)
  union all
  select format('column %I.%I.%I', checked.schema, checked.name, checked.column_name), checked.privilege
  from unnest($9::text[], $10::text[], $11::text[], $12::text[]) as checked (schema, name, column_name, privilege)
  where not has_column_privilege($1, format('%I.%I', checked.schema, checked.name), checked.column_name, checked.privilege)
) lacking
order by object collate "C", privilege collate "C"
`;

const lackingRowsSchema = z.array(
  z.object({ object: z.string(), privilege: z.string() }),
);

export const lackingPrivileges = async ({
  client,
  role,
}: LackingPrivilegesArgs) => {
  const checks = privilegeChecks(role);
  const schemaChecks = checks.filter(({ kind }) => kind === 'schema');
  const tablesChecks = checks.filter(({ kind }) => kind === 'tables');
  const tableChecks = checks.filter((check) => check.kind === 'table');
  const columnChecks = checks.filter((check) => check.kind === 'column');

  if (checks.length === 0) {
    return [];
  }

  const { rows } = await client.query({
    text: LACKING_SQL,
    values: [
      role.name,
      schemaChecks.map(({ schema }) => schema),
      schemaChecks.map(({ privilege }) => privilege),
      tablesChecks.map(({ schema }) => schema),
      tablesChecks.map(({ privilege }) => privilege),
      tableChecks.map(({ schema }) => schema),
      tableChecks.map(({ table }) => table),
      tableChecks.map(({ privilege }) => privilege),
      columnChecks.map(({ schema }) => schema),
      columnChecks.map(({ table }) => table),
      columnChecks.map(({ column }) => column),
      columnChecks.map(({ privilege }) => privilege),
    ],
  });

  return lackingRowsSchema.parse(rows);
};
