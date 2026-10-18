import { z } from 'zod';

import type { EvalsRole, MigrationClient, RoleGrant } from './migrate.types.ts';

import { inSequence } from '../ingest/inSequence.service.ts';
import { plainIdentifier } from '../queries/plainIdentifier.util.ts';
import { readerColumns } from '../queries/readerColumns.util.ts';
import { readSchemaColumns } from '../queries/readPublicColumns.service.ts';
import { PUBLIC_COLUMNS_TARGET, VIEWS_TARGET } from './migrate.constants.ts';

type ResolveGrantArgs = {
  readonly client: MigrationClient;
  readonly grant: RoleGrant;
};

type ResolveGrantsArgs = {
  readonly client: MigrationClient;
  readonly role: EvalsRole;
};

const VIEWS_SQL = `select c.relname as name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = $1 and c.relkind = 'v'
order by c.relname collate "C"`;

const viewRowsSchema = z.array(z.object({ name: z.string() }));

const viewGrants = async ({ client, grant }: ResolveGrantArgs) => {
  const schema = plainIdentifier(VIEWS_TARGET.exec(grant.on)?.[1] ?? '');
  const { rows } = await client.query({ text: VIEWS_SQL, values: [schema] });

  return viewRowsSchema.parse(rows).map(({ name }) => ({
    on: `table ${schema}.${plainIdentifier(name)}`,
    privileges: grant.privileges,
  }));
};

const columnGrants = async ({ client, grant }: ResolveGrantArgs) => {
  const byTable = Map.groupBy(
    [...readerColumns(await readSchemaColumns({ client }))].map((qualified) =>
      qualified.split('.', 2),
    ),
    ([table = '']) => table,
  );

  return [...byTable].map(([table, columns]) => ({
    columns: columns.map(([, column = '']) => plainIdentifier(column)),
    on: `table evals.${plainIdentifier(table)}`,
    privileges: grant.privileges,
  }));
};

const resolveGrant = async (args: ResolveGrantArgs) => {
  if (VIEWS_TARGET.test(args.grant.on)) {
    return viewGrants(args);
  }

  return args.grant.on === PUBLIC_COLUMNS_TARGET
    ? columnGrants(args)
    : [args.grant];
};

export const resolveGrants = async ({ client, role }: ResolveGrantsArgs) => {
  const grants: readonly (readonly RoleGrant[])[] = await inSequence({
    items: role.grants,
    step: (grant) => resolveGrant({ client, grant }),
  });

  return { ...role, grants: grants.flat() };
};
