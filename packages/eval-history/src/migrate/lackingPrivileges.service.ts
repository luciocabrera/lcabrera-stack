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
  const tableChecks = checks.filter(({ kind }) => kind === 'tables');

  if (checks.length === 0) {
    return [];
  }

  const { rows } = await client.query({
    text: LACKING_SQL,
    values: [
      role.name,
      schemaChecks.map(({ schema }) => schema),
      schemaChecks.map(({ privilege }) => privilege),
      tableChecks.map(({ schema }) => schema),
      tableChecks.map(({ privilege }) => privilege),
    ],
  });

  return lackingRowsSchema.parse(rows);
};
