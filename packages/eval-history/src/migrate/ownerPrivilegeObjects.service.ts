import { z } from 'zod';

import type { MigrationClient } from './migrate.types.ts';

import { USER_SCHEMA_PREDICATE } from './migrate.constants.ts';

type NamesArgs = OwnerPrivilegeObjectsArgs & {
  readonly text: string;
};

type OwnerPrivilegeObjectsArgs = {
  readonly client: MigrationClient;
  readonly role: string;
};

const DEFINER_VIEWS_SQL = `select n.nspname || '.' || c.relname as name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where ${USER_SCHEMA_PREDICATE}
  and c.relkind = 'v'
  and has_table_privilege($1, c.oid, 'select')
  and not exists (
    select from pg_depend d
    where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e'
  )
  and not coalesce(
    (
      select reloption.option_value::boolean
      from pg_options_to_table(c.reloptions) reloption
      where reloption.option_name = 'security_invoker'
    ),
    false
  )
order by (n.nspname || '.' || c.relname) collate "C"`;

const DEFINER_FUNCTIONS_SQL = `select n.nspname || '.' || p.proname || '(' || oidvectortypes(p.proargtypes) || ')' as name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where ${USER_SCHEMA_PREDICATE}
  and p.prosecdef
  and has_function_privilege($1, p.oid, 'execute')
  and not exists (
    select from pg_depend d
    where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
  )
order by (n.nspname || '.' || p.proname || '(' || oidvectortypes(p.proargtypes) || ')') collate "C"`;

const nameRowsSchema = z.array(z.object({ name: z.string() }));

const names = async ({ client, role, text }: NamesArgs) => {
  const { rows } = await client.query({ text, values: [role] });

  return nameRowsSchema.parse(rows).map(({ name }) => name);
};

export const ownerPrivilegeObjects = async ({
  client,
  role,
}: OwnerPrivilegeObjectsArgs) => ({
  definerFunctions: await names({ client, role, text: DEFINER_FUNCTIONS_SQL }),
  definerViews: await names({ client, role, text: DEFINER_VIEWS_SQL }),
});
